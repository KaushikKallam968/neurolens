import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_lib/supabase';
import { verifyWebhookSignature } from '../_lib/replicate';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = JSON.stringify(req.body);
  const signature = req.headers['webhook-signature'] as string | null;
  if (!verifyWebhookSignature(body, signature)) return res.status(401).json({ error: 'Invalid signature' });

  const { id: predictionId, status, output, error: predError } = req.body;
  if (!predictionId) return res.status(400).json({ error: 'Missing prediction ID' });

  const { data: analysis } = await supabaseAdmin.from('analyses_v2').select('id, video_id').eq('replicate_prediction_id', predictionId).single();
  if (!analysis) return res.status(404).json({ error: 'Analysis not found' });

  if (status === 'succeeded' && output) {
    const results = typeof output === 'string' ? JSON.parse(output) : output;
    await supabaseAdmin.from('analyses_v2').update({
      status: 'complete', neural_score: results.neuralScore, percentile: results.percentile,
      metrics: results.metrics, timeline: results.timeline, sensory_timeline: results.sensoryTimeline,
      cognitive_load: results.cognitiveLoad, focus_score: results.focusScore, narrative_arc: results.narrativeArc,
      av_sync_score: results.avSyncScore, key_moments: results.keyMoments, peaks: results.peaks,
      suggestions: results.suggestions, video_meta: results.videoMeta, completed_at: new Date().toISOString(),
    }).eq('id', analysis.id);
    await supabaseAdmin.from('videos').update({ status: 'complete' }).eq('id', analysis.video_id);
    return res.json({ status: 'saved', analysisId: analysis.id });
  }

  if (status === 'failed') {
    await supabaseAdmin.from('analyses_v2').update({ status: 'error', error_message: predError || 'Failed' }).eq('id', analysis.id);
    return res.json({ status: 'error_saved' });
  }

  return res.json({ status: 'acknowledged' });
}
