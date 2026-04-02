import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, jsonResponse, errorResponse, handleCors } from './_lib/auth';
import { supabaseAdmin, createUserClient } from './_lib/supabase';
import { createPrediction } from './_lib/replicate';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return errorResponse(res, 'Method not allowed', 405);

  const auth = await requireAuth(req);
  if (auth.error) return errorResponse(res, auth.error, 401);

  const { analysisId, videoId } = req.body;
  if (!analysisId || !videoId) return errorResponse(res, 'analysisId and videoId are required');

  const supabase = createUserClient(req.headers.authorization!);
  const { data: video, error: videoError } = await supabase.from('videos').select('*').eq('id', videoId).single();
  if (videoError || !video) return errorResponse(res, 'Video not found', 404);

  const { data: urlData } = supabaseAdmin.storage.from('videos').getPublicUrl(video.storage_path);

  if (process.env.VITE_DEMO_MODE === 'true') {
    const mockResults = generateDemoResults();
    await supabaseAdmin.from('analyses_v2').update({
      status: 'complete', neural_score: mockResults.neuralScore, percentile: mockResults.percentile,
      metrics: mockResults.metrics, timeline: mockResults.timeline, completed_at: new Date().toISOString(),
    }).eq('id', analysisId);
    return jsonResponse(res, { status: 'complete', instant: true, data: mockResults });
  }

  const webhookUrl = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://neurolens.vercel.app'}/api/webhooks/replicate`;

  try {
    const prediction = await createPrediction({ video: urlData.publicUrl, content_type: video.content_type, extract_thumbnails: true }, webhookUrl);
    await supabaseAdmin.from('analyses_v2').update({ status: 'processing', replicate_prediction_id: prediction.id, processing_started_at: new Date().toISOString() }).eq('id', analysisId);
    await supabaseAdmin.from('videos').update({ status: 'processing' }).eq('id', videoId);
    return jsonResponse(res, { status: 'processing', predictionId: prediction.id, analysisId });
  } catch (err: any) {
    await supabaseAdmin.from('analyses_v2').update({ status: 'error', error_message: err.message }).eq('id', analysisId);
    return errorResponse(res, `Failed to start analysis: ${err.message}`, 500);
  }
}

function generateDemoResults() {
  const duration = 30;
  const timeline: Record<string, number[]> = {};
  const metrics = ['emotionalResonance', 'attentionFocus', 'memorability', 'narrativeComprehension', 'faceImpact', 'sceneImpact', 'motionEnergy'];
  for (const metric of metrics) {
    timeline[metric] = Array.from({ length: duration }, (_, i) => {
      const base = 0.5 + 0.2 * Math.sin(i * 0.2);
      return Math.round(Math.max(0, Math.min(1, base + (Math.random() - 0.5) * 0.1)) * 1000) / 1000;
    });
  }
  const metricSummary: Record<string, number> = {};
  for (const [key, values] of Object.entries(timeline)) {
    metricSummary[key] = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 1000) / 1000;
  }
  return { neuralScore: 72, percentile: 68, metrics: metricSummary, timeline, schemaVersion: 2 };
}
