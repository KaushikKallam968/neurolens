import { requireAuth, jsonResponse, errorResponse, corsHeaders } from './_lib/auth';
import { createUserClient } from './_lib/supabase';

export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') return corsHeaders();

  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, 401);

  const authHeader = request.headers.get('Authorization')!;
  const supabase = createUserClient(authHeader);
  const url = new URL(request.url);

  // GET /api/campaigns — list user's campaigns
  if (request.method === 'GET') {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*, videos(count)')
      .order('updated_at', { ascending: false });

    if (error) return errorResponse(error.message, 500);
    return jsonResponse(data);
  }

  // POST /api/campaigns — create a new campaign
  if (request.method === 'POST') {
    const body = await request.json();
    const { name, description, content_type } = body;

    if (!name) return errorResponse('Campaign name is required');

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        user_id: auth.userId,
        name,
        description: description || null,
        content_type: content_type || 'custom',
      })
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);
    return jsonResponse(data, 201);
  }

  return errorResponse('Method not allowed', 405);
}
