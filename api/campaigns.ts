import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, jsonResponse, errorResponse, handleCors } from './_lib/auth';
import { createUserClient } from './_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const auth = await requireAuth(req);
  if (auth.error) return errorResponse(res, auth.error, 401);

  const supabase = createUserClient(req.headers.authorization!);

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*, videos(count)')
      .order('updated_at', { ascending: false });
    if (error) return errorResponse(res, error.message, 500);
    return jsonResponse(res, data);
  }

  if (req.method === 'POST') {
    const { name, description, content_type } = req.body;
    if (!name) return errorResponse(res, 'Campaign name is required');
    const { data, error } = await supabase
      .from('campaigns')
      .insert({ user_id: auth.userId, name, description: description || null, content_type: content_type || 'custom' })
      .select()
      .single();
    if (error) return errorResponse(res, error.message, 500);
    return jsonResponse(res, data, 201);
  }

  return errorResponse(res, 'Method not allowed', 405);
}
