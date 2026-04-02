import { requireAuth, jsonResponse, errorResponse, corsHeaders } from './_lib/auth';
import { supabaseAdmin, createUserClient } from './_lib/supabase';
import { createPrediction } from './_lib/replicate';

export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') return corsHeaders();
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, 401);

  const body = await request.json();
  const { campaignId, filename, contentType, fileSize } = body;

  if (!campaignId || !filename) {
    return errorResponse('campaignId and filename are required');
  }

  // Validate file size (50MB limit)
  if (fileSize && fileSize > 50 * 1024 * 1024) {
    return errorResponse('File size exceeds 50MB limit');
  }

  const authHeader = request.headers.get('Authorization')!;
  const supabase = createUserClient(authHeader);

  // 1. Create video record
  const { data: video, error: videoError } = await supabase
    .from('videos')
    .insert({
      campaign_id: campaignId,
      user_id: auth.userId,
      filename,
      storage_path: `${auth.userId}/${crypto.randomUUID()}/${filename}`,
      content_type: contentType || 'custom',
      file_size: fileSize || null,
      status: 'uploaded',
    })
    .select()
    .single();

  if (videoError) return errorResponse(videoError.message, 500);

  // 2. Generate signed upload URL (direct to Supabase Storage, bypasses 4.5MB Edge limit)
  const { data: signedUrl, error: signError } = await supabaseAdmin.storage
    .from('videos')
    .createSignedUploadUrl(video.storage_path);

  if (signError) return errorResponse(signError.message, 500);

  // 3. Create analysis record (pending)
  const { data: analysis, error: analysisError } = await supabase
    .from('analyses_v2')
    .insert({
      video_id: video.id,
      user_id: auth.userId,
      content_type: contentType || 'custom',
      status: 'pending',
    })
    .select()
    .single();

  if (analysisError) return errorResponse(analysisError.message, 500);

  return jsonResponse({
    videoId: video.id,
    analysisId: analysis.id,
    uploadUrl: signedUrl.signedUrl,
    storagePath: video.storage_path,
  }, 201);
}
