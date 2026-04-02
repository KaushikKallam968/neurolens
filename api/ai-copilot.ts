import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, errorResponse, handleCors } from './_lib/auth';
import { createUserClient } from './_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return errorResponse(res, 'Method not allowed', 405);

  const auth = await requireAuth(req);
  if (auth.error) return errorResponse(res, auth.error, 401);

  const { analysisId } = req.body;
  if (!analysisId) return errorResponse(res, 'analysisId is required');

  const supabase = createUserClient(req.headers.authorization!);
  const { data: analysis, error } = await supabase.from('analyses_v2').select('*').eq('id', analysisId).single();
  if (error || !analysis) return errorResponse(res, 'Analysis not found', 404);
  if (analysis.status !== 'complete') return errorResponse(res, 'Analysis not yet complete');

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) return errorResponse(res, 'AI analysis unavailable', 503);

  const prompt = buildPrompt(analysis);
  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1024, stream: false, messages: [{ role: 'user', content: prompt }] }),
  });

  if (!claudeRes.ok) return errorResponse(res, 'AI analysis failed', 502);
  const result = await claudeRes.json() as any;
  const text = result.content?.[0]?.text || 'Analysis unavailable';

  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.json({ analysis: text });
}

function buildPrompt(analysis: Record<string, unknown>): string {
  const metrics = analysis.metrics as Record<string, number> || {};
  return `You are a creative strategist analyzing brain-predicted engagement data from a ${analysis.content_type || 'video'}.

Neural Score: ${analysis.neural_score}/100
Metrics: ${JSON.stringify(metrics, null, 2)}
Key Moments: ${JSON.stringify((analysis.key_moments as any[] || []).slice(0, 5), null, 2)}

Provide strategic creative direction in 3-4 concise paragraphs. Be specific. Reference timestamps. Write for a creative director.`;
}
