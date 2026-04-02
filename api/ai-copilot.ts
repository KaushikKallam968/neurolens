import { requireAuth, jsonResponse, errorResponse, corsHeaders } from './_lib/auth';
import { createUserClient } from './_lib/supabase';

export const config = { runtime: 'edge' };

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') return corsHeaders();
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, 401);

  const body = await request.json();
  const { analysisId } = body;

  if (!analysisId) return errorResponse('analysisId is required');

  const authHeader = request.headers.get('Authorization')!;
  const supabase = createUserClient(authHeader);

  // Fetch analysis data
  const { data: analysis, error } = await supabase
    .from('analyses_v2')
    .select('*')
    .eq('id', analysisId)
    .single();

  if (error || !analysis) return errorResponse('Analysis not found', 404);
  if (analysis.status !== 'complete') return errorResponse('Analysis not yet complete');

  if (!ANTHROPIC_API_KEY) {
    return errorResponse('AI analysis unavailable — API key not configured', 503);
  }

  // Build prompt with analysis data
  const prompt = buildPrompt(analysis);

  // Stream response from Claude
  const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!claudeResponse.ok) {
    return errorResponse('AI analysis failed — please try again', 502);
  }

  // Forward the streaming response
  return new Response(claudeResponse.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function buildPrompt(analysis: Record<string, unknown>): string {
  const metrics = analysis.metrics as Record<string, number> || {};
  const score = analysis.neural_score;
  const contentType = analysis.content_type;
  const keyMoments = analysis.key_moments as Array<Record<string, unknown>> || [];
  const suggestions = analysis.suggestions as Array<Record<string, unknown>> || [];

  return `You are a creative strategist analyzing brain-predicted engagement data from a ${contentType || 'video'}.

Neural Score: ${score}/100
Metrics: ${JSON.stringify(metrics, null, 2)}
Key Moments: ${JSON.stringify(keyMoments.slice(0, 5), null, 2)}
Existing Suggestions: ${JSON.stringify(suggestions.slice(0, 3), null, 2)}

Provide strategic creative direction in 3-4 concise paragraphs:
1. What the brain data tells us about how viewers experience this content
2. The specific moments that work and why (reference timestamps)
3. 2-3 concrete, actionable changes to improve the neural score
4. How this content compares to typical performance for ${contentType || 'video'} content

Be specific and reference the actual data. No generic advice. Write for a creative director, not a neuroscientist.`;
}
