import { supabaseAdmin } from '../_lib/supabase';
import { jsonResponse, errorResponse, corsHeaders } from '../_lib/auth';

export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') return corsHeaders();
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const url = new URL(request.url);
  const token = url.pathname.split('/').pop();

  if (!token) return errorResponse('Token required', 400);

  // Look up share token — no auth required (this is the public share endpoint)
  const { data: shareToken, error } = await supabaseAdmin
    .from('share_tokens')
    .select('*, analyses_v2(*, videos(filename))')
    .eq('token', token)
    .single();

  if (error || !shareToken) {
    return errorResponse('Share link not found', 404);
  }

  // Check expiry
  if (shareToken.expires_at && new Date(shareToken.expires_at) < new Date()) {
    return errorResponse('This share link has expired. Contact the owner for a new one.', 410);
  }

  const analysis = shareToken.analyses_v2;
  if (!analysis || analysis.status !== 'complete') {
    return errorResponse('Analysis not yet complete', 404);
  }

  // Build response based on visibility setting
  const response: Record<string, unknown> = {
    filename: analysis.videos?.filename,
    contentType: analysis.content_type,
    neuralScore: analysis.neural_score,
    percentile: analysis.percentile,
    schemaVersion: analysis.schema_version,
    visibility: shareToken.visibility,
  };

  if (shareToken.visibility === 'full') {
    response.metrics = analysis.metrics;
    response.timeline = analysis.timeline;
    response.sensoryTimeline = analysis.sensory_timeline;
    response.cognitiveLoad = analysis.cognitive_load;
    response.focusScore = analysis.focus_score;
    response.narrativeArc = analysis.narrative_arc;
    response.avSyncScore = analysis.av_sync_score;
    response.keyMoments = analysis.key_moments;
    response.suggestions = analysis.suggestions;
  } else if (shareToken.visibility === 'specific_metrics' && shareToken.visible_metrics) {
    const filtered: Record<string, unknown> = {};
    for (const metric of shareToken.visible_metrics) {
      if (analysis.metrics?.[metric] !== undefined) {
        filtered[metric] = analysis.metrics[metric];
      }
    }
    response.metrics = filtered;
  }
  // 'scores_only' — just neuralScore and percentile (already included)

  return jsonResponse(response);
}
