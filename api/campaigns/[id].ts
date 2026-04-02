import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, jsonResponse, errorResponse, handleCors } from '../_lib/auth';
import { createUserClient } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const auth = await requireAuth(req);
  if (auth.error) return errorResponse(res, auth.error, 401);

  const supabase = createUserClient(req.headers.authorization!);
  const { id } = req.query;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*, videos(*, analyses_v2(id, status, neural_score, content_type, completed_at))')
      .eq('id', id)
      .single();
    if (error) return errorResponse(res, error.message, 404);
    return jsonResponse(res, data);
  }

  if (req.method === 'PUT') {
    const { name, description, content_type } = req.body;
    const { data, error } = await supabase
      .from('campaigns')
      .update({ ...(name !== undefined && { name }), ...(description !== undefined && { description }), ...(content_type !== undefined && { content_type }) })
      .eq('id', id)
      .select()
      .single();
    if (error) return errorResponse(res, error.message, 500);
    return jsonResponse(res, data);
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) return errorResponse(res, error.message, 500);
    return jsonResponse(res, { deleted: true });
  }

  return errorResponse(res, 'Method not allowed', 405);
}
