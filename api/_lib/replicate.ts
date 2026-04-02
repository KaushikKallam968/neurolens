const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN!;
const REPLICATE_WEBHOOK_SECRET = process.env.REPLICATE_WEBHOOK_SECRET;

// Replicate model version — pin to specific hash for reproducibility
const MODEL_VERSION = process.env.REPLICATE_MODEL_VERSION || 'latest';

interface ReplicateInput {
  video: string;        // URL to video in Supabase Storage
  content_type: string;
  extract_thumbnails: boolean;
}

interface ReplicatePrediction {
  id: string;
  status: string;
  output?: string;
  error?: string;
  urls: { get: string; cancel: string };
}

export async function createPrediction(
  input: ReplicateInput,
  webhookUrl: string
): Promise<ReplicatePrediction> {
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

export async function getPrediction(predictionId: string): Promise<ReplicatePrediction> {
  const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
    headers: {
      'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Replicate API error (${response.status})`);
  }

  return response.json();
}

export function verifyWebhookSignature(body: string, signature: string | null): boolean {
  if (!REPLICATE_WEBHOOK_SECRET || !signature) return false;

  // Replicate uses HMAC-SHA256 for webhook signatures
  // In Edge Functions, we use Web Crypto API
  // For now, basic check — implement full HMAC in production
  return signature.length > 0;
}
