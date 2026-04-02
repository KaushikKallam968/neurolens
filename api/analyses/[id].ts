import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, jsonResponse, errorResponse, handleCors } from '../_lib/auth';
import { createUserClient, supabaseAdmin } from '../_lib/supabase';
import { getPrediction } from '../_lib/replicate';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return errorResponse(res, 'Method not allowed', 405);

  const auth = await requireAuth(req);
  if (auth.error) return errorResponse(res, auth.error, 401);

  const supabase = createUserClient(req.headers.authorization!);
  const { id } = req.query;

  const { data: analysis, error } = await supabase
    .from('analyses_v2')
    .select('*, videos(filename, storage_path, content_type)')
    .eq('id', id)
    .single();
  if (error || !analysis) return errorResponse(res, 'Analysis not found', 404);

  const response: Record<string, unknown> = {
    analysisId: analysis.id, status: analysis.status,
    filename: analysis.videos?.filename, contentType: analysis.content_type, schemaVersion: analysis.schema_version,
  };

  if (analysis.status === 'complete') {
    response.data = {
      neuralScore: analysis.neural_score, percentile: analysis.percentile,
      metrics: analysis.metrics, timeline: analysis.timeline,
      sensoryTimeline: analysis.sensory_timeline, cognitiveLoad: analysis.cognitive_load,
      focusScore: analysis.focus_score, narrativeArc: analysis.narrative_arc,
      avSyncScore: analysis.av_sync_score, keyMoments: analysis.key_moments,
      peaks: analysis.peaks, suggestions: analysis.suggestions, videoMeta: analysis.video_meta,
    };
  }
  if (analysis.status === 'error') response.error = analysis.error_message;

  return jsonResponse(res, response);
}
