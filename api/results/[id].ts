import type { VercelRequest, VercelResponse } from '@vercel/node';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  if (!id || !REPLICATE_API_TOKEN) {
    return res.status(400).json({ error: 'Missing prediction ID or API token' });
  }

  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch prediction status' });
    }

    const prediction = await response.json();

    if (prediction.status === 'succeeded' && prediction.output) {
      const data = typeof prediction.output === 'string' ? JSON.parse(prediction.output) : prediction.output;
      return res.json({
        analysisId: id,
        status: 'complete',
        data,
      });
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      return res.json({
        analysisId: id,
        status: 'error',
        error: prediction.error || 'Prediction failed',
      });
    }

    // Map Replicate stages to our stage names
    const logs = prediction.logs || '';
    let stage = null;
    if (logs.includes('computing_metrics')) stage = 'computing_metrics';
    else if (logs.includes('predicting')) stage = 'predicting';
    else if (logs.includes('extracting_events')) stage = 'extracting_events';
    else if (prediction.status === 'processing') stage = 'extracting_events';
    else if (prediction.status === 'starting') stage = null;

    return res.json({
      analysisId: id,
      status: 'processing',
      stage,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to check status' });
  }
}
