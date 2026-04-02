import { supabaseAdmin } from '../_lib/supabase';
import { verifyWebhookSignature } from '../_lib/replicate';
import { jsonResponse, errorResponse } from '../_lib/auth';

export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  const body = await request.text();
  const signature = request.headers.get('webhook-signature');

  // Verify webhook authenticity
  if (!verifyWebhookSignature(body, signature)) {
    return errorResponse('Invalid webhook signature', 401);
  }

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  const { id: predictionId, status, output, error } = payload;

  if (!predictionId) {
    return errorResponse('Missing prediction ID', 400);
  }

  // Find the analysis by Replicate prediction ID
  const { data: analysis, error: findError } = await supabaseAdmin
    .from('analyses_v2')
    .select('id, video_id')
    .eq('replicate_prediction_id', predictionId)
    .single();

  if (findError || !analysis) {
    console.error(`Analysis not found for prediction ${predictionId}`);
    return errorResponse('Analysis not found', 404);
  }

  if (status === 'succeeded' && output) {
    // Parse the output JSON from Replicate
    let results;
    try {
      results = typeof output === 'string' ? JSON.parse(output) : output;
    } catch {
      await supabaseAdmin.from('analyses_v2').update({
        status: 'error',
        error_message: 'Failed to parse Replicate output',
      }).eq('id', analysis.id);
      return errorResponse('Invalid output format', 400);
    }

    // Save results to Supabase
    const { error: updateError } = await supabaseAdmin.from('analyses_v2').update({
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
    }).eq('id', analysis.id);

    if (updateError) {
      console.error('Failed to save results:', updateError);
      return errorResponse('Failed to save results', 500);
    }

    // Update video status
    await supabaseAdmin.from('videos').update({ status: 'complete' }).eq('id', analysis.video_id);

    // Add to benchmarks for percentile computation
    if (results.metrics) {
      const benchmarkRows = Object.entries(results.metrics).map(([metric, value]) => ({
        content_type: results.contentType || 'custom',
        metric_name: metric,
        metric_value: value as number,
        neural_score: results.neuralScore,
        analysis_id: analysis.id,
      }));

      await supabaseAdmin.from('benchmarks').insert(benchmarkRows);
    }

    return jsonResponse({ status: 'saved', analysisId: analysis.id });
  }

  if (status === 'failed') {
    await supabaseAdmin.from('analyses_v2').update({
      status: 'error',
      error_message: error || 'Replicate prediction failed',
    }).eq('id', analysis.id);

    await supabaseAdmin.from('videos').update({ status: 'error' }).eq('id', analysis.video_id);

    return jsonResponse({ status: 'error_saved', analysisId: analysis.id });
  }

  // Other statuses (processing, starting) — acknowledge but don't update
  return jsonResponse({ status: 'acknowledged' });
}
