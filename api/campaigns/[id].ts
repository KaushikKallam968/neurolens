import { requireAuth, jsonResponse, errorResponse, corsHeaders } from '../_lib/auth';
import { createUserClient } from '../_lib/supabase';

export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') return corsHeaders();

  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, 401);

  const authHeader = request.headers.get('Authorization')!;
  const supabase = createUserClient(authHeader);
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();

  // GET /api/campaigns/:id — get single campaign with videos
  if (request.method === 'GET') {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*, videos(*, analyses_v2(id, status, neural_score, content_type, completed_at))')
      .eq('id', id)
      .single();

    if (error) return errorResponse(error.message, 404);
    return jsonResponse(data);
  }

  // PUT /api/campaigns/:id — update campaign
  if (request.method === 'PUT') {
    const body = await request.json();
    const { name, description, content_type } = body;

    const { data, error } = await supabase
      .from('campaigns')
      .update({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(content_type !== undefined && { content_type }),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);
    return jsonResponse(data);
  }

  // DELETE /api/campaigns/:id — delete campaign (cascade deletes videos + analyses)
  if (request.method === 'DELETE') {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ deleted: true });
  }

  return errorResponse('Method not allowed', 405);
}
