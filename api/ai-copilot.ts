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

  const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
  if (!GOOGLE_AI_API_KEY) return errorResponse(res, 'AI analysis unavailable — API key not configured', 503);

  const prompt = buildPrompt(analysis);

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', errText);
      return errorResponse(res, 'AI analysis failed — please try again', 502);
    }

    const result = await geminiRes.json() as any;
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || 'Analysis unavailable';

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json({ analysis: text });
  } catch (err: any) {
    console.error('Gemini request failed:', err.message);
    return errorResponse(res, 'AI analysis failed', 502);
  }
}

function buildPrompt(analysis: Record<string, unknown>): string {
  const metrics = analysis.metrics as Record<string, number> || {};
  return `You are a creative strategist analyzing brain-predicted engagement data from a ${analysis.content_type || 'video'}.

Neural Score: ${analysis.neural_score}/100
Metrics: ${JSON.stringify(metrics, null, 2)}
Key Moments: ${JSON.stringify((analysis.key_moments as any[] || []).slice(0, 5), null, 2)}

Provide strategic creative direction in 3-4 concise paragraphs:
1. What the brain data tells us about how viewers experience this content
2. The specific moments that work and why (reference timestamps)
3. 2-3 concrete, actionable changes to improve the neural score
4. How this content compares to typical performance for ${analysis.content_type || 'video'} content

Be specific. Reference the actual data. No generic advice. Write for a creative director, not a neuroscientist.`;
}
