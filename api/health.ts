import { jsonResponse } from './_lib/auth';

export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  return jsonResponse({
    status: 'ok',
    version: '2.0.0',
    mode: process.env.VITE_DEMO_MODE === 'true' ? 'demo' : 'production',
    timestamp: new Date().toISOString(),
  });
}
