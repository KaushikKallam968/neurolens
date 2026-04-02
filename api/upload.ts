import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, jsonResponse, errorResponse, handleCors } from './_lib/auth';
import { supabaseAdmin, createUserClient } from './_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return errorResponse(res, 'Method not allowed', 405);

  const auth = await requireAuth(req);
  if (auth.error) return errorResponse(res, auth.error, 401);

  const { campaignId, filename, contentType, fileSize } = req.body;
  if (!campaignId || !filename) return errorResponse(res, 'campaignId and filename are required');
  if (fileSize && fileSize > 50 * 1024 * 1024) return errorResponse(res, 'File size exceeds 50MB limit');

  const supabase = createUserClient(req.headers.authorization!);
  const storagePath = `${auth.userId}/${crypto.randomUUID()}/${filename}`;

  const { data: video, error: videoError } = await supabase
    .from('videos')
    .insert({ campaign_id: campaignId, user_id: auth.userId, filename, storage_path: storagePath, content_type: contentType || 'custom', file_size: fileSize || null, status: 'uploaded' })
    .select().single();
  if (videoError) return errorResponse(res, videoError.message, 500);

  const { data: signedUrl, error: signError } = await supabaseAdmin.storage.from('videos').createSignedUploadUrl(storagePath);
  if (signError) return errorResponse(res, signError.message, 500);

  const { data: analysis, error: analysisError } = await supabase
    .from('analyses_v2')
    .insert({ video_id: video.id, user_id: auth.userId, content_type: contentType || 'custom', status: 'pending' })
    .select().single();
  if (analysisError) return errorResponse(res, analysisError.message, 500);

  return jsonResponse(res, { videoId: video.id, analysisId: analysis.id, uploadUrl: signedUrl.signedUrl, storagePath }, 201);
}
