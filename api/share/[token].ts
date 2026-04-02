import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token required' });

  const { data: shareToken, error } = await supabaseAdmin
    .from('share_tokens')
    .select('*, analyses_v2(*, videos(filename))')
    .eq('token', token)
    .single();
  if (error || !shareToken) return res.status(404).json({ error: 'Share link not found' });

  if (shareToken.expires_at && new Date(shareToken.expires_at) < new Date()) {
    return res.status(410).json({ error: 'This share link has expired.' });
  }

  const analysis = shareToken.analyses_v2;
  if (!analysis || analysis.status !== 'complete') return res.status(404).json({ error: 'Analysis not yet complete' });

  const response: Record<string, unknown> = {
    filename: analysis.videos?.filename, contentType: analysis.content_type,
    neuralScore: analysis.neural_score, percentile: analysis.percentile, visibility: shareToken.visibility,
  };

  if (shareToken.visibility === 'full') {
    response.metrics = analysis.metrics;
    response.timeline = analysis.timeline;
    response.suggestions = analysis.suggestions;
  }

  return res.json(response);
}
