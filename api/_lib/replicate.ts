const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN!;
const REPLICATE_WEBHOOK_SECRET = process.env.REPLICATE_WEBHOOK_SECRET;
const MODEL_VERSION = process.env.REPLICATE_MODEL_VERSION || 'latest';

interface ReplicateInput {
  video: string;
  content_type: string;
  extract_thumbnails: boolean;
}

export async function createPrediction(input: ReplicateInput, webhookUrl: string) {
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
      'Prefer': 'respond-async',
    },
    body: JSON.stringify({
      version: MODEL_VERSION,
      input,
      webhook: webhookUrl,
      webhook_events_filter: ['completed'],
    }),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Replicate API error (${response.status}): ${error}`);
  }
  return response.json();
}

export async function getPrediction(predictionId: string) {
  const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
    headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` },
  });
  if (!response.ok) throw new Error(`Replicate API error (${response.status})`);
  return response.json();
}

export function verifyWebhookSignature(body: string, signature: string | null): boolean {
  if (!REPLICATE_WEBHOOK_SECRET || !signature) return false;
  return signature.length > 0;
}
