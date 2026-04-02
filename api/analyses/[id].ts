import { requireAuth, jsonResponse, errorResponse, corsHeaders } from '../_lib/auth';
import { createUserClient, supabaseAdmin } from '../_lib/supabase';
import { getPrediction } from '../_lib/replicate';

export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') return corsHeaders();
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, 401);

  const authHeader = request.headers.get('Authorization')!;
  const supabase = createUserClient(authHeader);
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();

  // Get analysis with video info
  const { data: analysis, error } = await supabase
    .from('analyses_v2')
    .select('*, videos(filename, storage_path, content_type)')
    .eq('id', id)
    .single();

  if (error || !analysis) return errorResponse('Analysis not found', 404);

  // If still processing, check Replicate status as fallback
  if (analysis.status === 'processing' && analysis.replicate_prediction_id) {
    try {
      const prediction = await getPrediction(analysis.replicate_prediction_id);

      if (prediction.status === 'succeeded' && prediction.output) {
        // Webhook may have been missed — save results now
        const results = typeof prediction.output === 'string'
          ? JSON.parse(prediction.output) : prediction.output;

        await supabaseAdmin.from('analyses_v2').update({
          status: 'complete',
          neural_score: results.neuralScore,
          percentile: results.percentile,
          metrics: results.metrics,
          timeline: results.timeline,
          sensory_timeline: results.sensoryTimeline,
          cognitive_load: results.cognitiveLoad,
          focus_score: results.focusScore,
          narrative_arc: results.narrativeArc,
          av_sync_score: results.avSyncScore,
          key_moments: results.keyMoments,
          peaks: results.peaks,
          suggestions: results.suggestions,
          video_meta: results.videoMeta,
          completed_at: new Date().toISOString(),
        }).eq('id', id);

        // Return the now-complete data
        analysis.status = 'complete';
        analysis.neural_score = results.neuralScore;
        analysis.metrics = results.metrics;
        analysis.timeline = results.timeline;
      } else if (prediction.status === 'failed') {
        await supabaseAdmin.from('analyses_v2').update({
          status: 'error',
          error_message: prediction.error || 'Analysis failed',
        }).eq('id', id);
        analysis.status = 'error';
        analysis.error_message = prediction.error;
      }
    } catch {
      // Replicate API unavailable — return current state
    }
  }

  // Format response to match frontend expectations
  const response: Record<string, unknown> = {
    analysisId: analysis.id,
    status: analysis.status,
    filename: analysis.videos?.filename,
    contentType: analysis.content_type,
    schemaVersion: analysis.schema_version,
  };

  if (analysis.status === 'complete') {
    response.data = {
      neuralScore: analysis.neural_score,
      percentile: analysis.percentile,
      metrics: analysis.metrics,
      timeline: analysis.timeline,
      sensoryTimeline: analysis.sensory_timeline,
      cognitiveLoad: analysis.cognitive_load,
      focusScore: analysis.focus_score,
      narrativeArc: analysis.narrative_arc,
      avSyncScore: analysis.av_sync_score,
      keyMoments: analysis.key_moments,
      peaks: analysis.peaks,
      suggestions: analysis.suggestions,
      videoMeta: analysis.video_meta,
    };
  }

  if (analysis.status === 'error') {
    response.error = analysis.error_message;
  }

  return jsonResponse(response);
}
