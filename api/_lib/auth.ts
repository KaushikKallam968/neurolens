import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUser } from './supabase';

export async function requireAuth(req: VercelRequest): Promise<{ userId: string | null; error: string | null }> {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return { userId: null, error: 'Missing Authorization header' };
  }

  const user = await getUser(authHeader);
  if (!user) {
    return { userId: null, error: 'Invalid or expired token' };
  }

  return { userId: user.id, error: null };
}

export function jsonResponse(res: VercelResponse, data: unknown, status = 200) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res.status(status).json(data);
}

export function errorResponse(res: VercelResponse, message: string, status = 400) {
  return jsonResponse(res, { error: message }, status);
}

export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}
