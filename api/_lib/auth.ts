import { getUser } from './supabase';

export interface AuthResult {
  userId: string;
  error: null;
}

export interface AuthError {
  userId: null;
  error: string;
}

export async function requireAuth(request: Request): Promise<AuthResult | AuthError> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return { userId: null, error: 'Missing Authorization header' };
  }

  const user = await getUser(authHeader);
  if (!user) {
    return { userId: null, error: 'Invalid or expired token' };
  }

  return { userId: user.id, error: null };
}

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

export function corsHeaders() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
