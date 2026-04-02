import { requireAuth, jsonResponse, errorResponse, corsHeaders } from './_lib/auth';
import { supabaseAdmin, createUserClient } from './_lib/supabase';
import { createPrediction } from './_lib/replicate';

export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') return corsHeaders();
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, 401);

  const body = await request.json();
  const { analysisId, videoId } = body;

  if (!analysisId || !videoId) {
    return errorResponse('analysisId and videoId are required');
  }

  const authHeader = request.headers.get('Authorization')!;
  const supabase = createUserClient(authHeader);

  // Get video details
  const { data: video, error: videoError } = await supabase
    .from('videos')
    .select('*')
    .eq('id', videoId)
    .single();

  if (videoError || !video) return errorResponse('Video not found', 404);

  // Get public URL for the video in storage
  const { data: urlData } = supabaseAdmin.storage
    .from('videos')
    .getPublicUrl(video.storage_path);

  // Check if demo mode — use mock inference instead
  if (process.env.VITE_DEMO_MODE === 'true') {
    // Import mock results (same format as real analysis)
    const mockResults = generateDemoResults();

    await supabaseAdmin.from('analyses_v2').update({
      status: 'complete',
      neural_score: mockResults.neuralScore,
      percentile: mockResults.percentile,
      metrics: mockResults.metrics,
      timeline: mockResults.timeline,
      sensory_timeline: mockResults.sensoryTimeline,
      cognitive_load: mockResults.cognitiveLoad,
      focus_score: mockResults.focusScore,
      narrative_arc: mockResults.narrativeArc,
      av_sync_score: mockResults.avSyncScore,
      key_moments: mockResults.keyMoments,
      peaks: mockResults.peaks,
      suggestions: mockResults.suggestions,
      completed_at: new Date().toISOString(),
    }).eq('id', analysisId);

    return jsonResponse({ status: 'complete', instant: true, data: mockResults });
  }

  // Trigger Replicate prediction
  const webhookUrl = `${process.env.VERCEL_URL || 'https://neurolens.vercel.app'}/api/webhooks/replicate`;

  try {
    const prediction = await createPrediction(
      {
        video: urlData.publicUrl,
        content_type: video.content_type,
        extract_thumbnails: true,
      },
      webhookUrl
    );

    // Update analysis with Replicate prediction ID
    await supabaseAdmin.from('analyses_v2').update({
      status: 'processing',
      replicate_prediction_id: prediction.id,
      processing_started_at: new Date().toISOString(),
    }).eq('id', analysisId);

    // Update video status
    await supabaseAdmin.from('videos').update({ status: 'processing' }).eq('id', videoId);

    return jsonResponse({
      status: 'processing',
      predictionId: prediction.id,
      analysisId,
    });
  } catch (err: any) {
    await supabaseAdmin.from('analyses_v2').update({
      status: 'error',
      error_message: err.message,
    }).eq('id', analysisId);

    return errorResponse(`Failed to start analysis: ${err.message}`, 500);
  }
}

// Simple demo results generator (replaces Python mock_inference for Edge runtime)
function generateDemoResults() {
  const duration = 30;
  const timeline: Record<string, number[]> = {};
  const metrics = ['emotionalResonance', 'attentionFocus', 'memorability',
    'narrativeComprehension', 'faceImpact', 'sceneImpact', 'motionEnergy'];

  for (const metric of metrics) {
    timeline[metric] = Array.from({ length: duration }, (_, i) => {
      const base = 0.5 + 0.2 * Math.sin(i * 0.2);
      const noise = (Math.random() - 0.5) * 0.1;
      return Math.round(Math.max(0, Math.min(1, base + noise)) * 1000) / 1000;
    });
  }

  const metricSummary: Record<string, number> = {};
  for (const [key, values] of Object.entries(timeline)) {
    metricSummary[key] = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 1000) / 1000;
  }

  return {
    neuralScore: 72,
    percentile: 68,
    metrics: metricSummary,
    timeline,
    sensoryTimeline: { visual: timeline.sceneImpact, audio: timeline.emotionalResonance, language: timeline.narrativeComprehension },
    cognitiveLoad: { score: 65, timeline: timeline.attentionFocus, label: 'Moderate' },
    focusScore: { score: 70, label: 'Good' },
    narrativeArc: { curve: timeline.emotionalResonance, hookStrength: 0.78, climaxTime: 15, climaxValue: 0.85, endingStrength: 0.65 },
    avSyncScore: { score: 80, label: 'Well-synced' },
    keyMoments: [
      { timestamp: 2, type: 'hook', label: 'Opening hook', metric: 'attentionFocus', value: 0.85 },
      { timestamp: 15, type: 'peak', label: 'Emotional peak', metric: 'emotionalResonance', value: 0.9 },
    ],
    peaks: [{ timestamp: 15, metric: 'emotionalResonance', value: 0.9 }],
    suggestions: [
      { type: 'improve', timestamp: 20, message: 'Attention drops here — consider adding a visual hook or scene change', priority: 'high' },
    ],
    contentType: 'custom',
    schemaVersion: 2,
  };
}
