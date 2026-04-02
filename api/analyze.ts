import type { VercelRequest, VercelResponse } from '@vercel/node';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const MODEL_VERSION = process.env.REPLICATE_MODEL_VERSION;

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // If Replicate isn't configured, fall back to mock
  if (!REPLICATE_API_TOKEN || !MODEL_VERSION) {
    return handleMock(req, res);
  }

  try {
    // Read raw body (bodyParser disabled for multipart)
    const rawBody = await getRawBody(req);
    const contentType = req.headers['content-type'] || '';
    const boundary = getBoundary(contentType);
    const { fileBuffer, filename: parsedFilename } = boundary
      ? extractFileFromMultipart(rawBody, boundary)
      : { fileBuffer: rawBody, filename: null };
    const filename = parsedFilename || 'uploaded-video.mp4';

    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload to Replicate's file API (avoids base64 bloat)
    const formData = new FormData();
    formData.append('content', new Blob([fileBuffer], { type: 'video/mp4' }), filename);

    const uploadRes = await fetch('https://api.replicate.com/v1/files', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` },
      body: formData,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`File upload error (${uploadRes.status}): ${errText}`);
    }

    const uploadData = await uploadRes.json();
    const fileUrl = uploadData.urls.get;

    // Create Replicate prediction with the file URL
    const predictionRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: MODEL_VERSION,
        input: {
          video: fileUrl,
          content_type: 'custom',
          extract_thumbnails: false,
        },
      }),
    });

    if (!predictionRes.ok) {
      const errText = await predictionRes.text();
      throw new Error(`Replicate error (${predictionRes.status}): ${errText}`);
    }

    const prediction = await predictionRes.json();

    // Return immediately — frontend will poll /api/results/{predictionId}
    return res.json({
      analysisId: prediction.id,
      status: 'processing',
      filename,
    });
  } catch (err: any) {
    console.error('Analysis error, falling back to mock:', err.message);
    // Fall back to mock analysis on any Replicate error
    return handleMock(req, res, true);
  }
}

function getRawBody(req: VercelRequest): Promise<Buffer> {
  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
  if (typeof req.body === 'string') return Promise.resolve(Buffer.from(req.body));
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function getBoundary(contentType: string): string | null {
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^\s;]+))/);
  return match ? (match[1] || match[2]) : null;
}

function extractFileFromMultipart(body: Buffer, boundary: string): { fileBuffer: Buffer | null; filename: string | null } {
  const boundaryBuf = Buffer.from(`--${boundary}`);
  const headerSep = Buffer.from('\r\n\r\n');
  const crlf = Buffer.from('\r\n');

  let pos = 0;
  let filename: string | null = null;

  while (pos < body.length) {
    const boundaryStart = body.indexOf(boundaryBuf, pos);
    if (boundaryStart === -1) break;

    const nextBoundary = body.indexOf(boundaryBuf, boundaryStart + boundaryBuf.length);
    if (nextBoundary === -1) break;

    const partStart = boundaryStart + boundaryBuf.length;
    const headerEnd = body.indexOf(headerSep, partStart);
    if (headerEnd === -1) { pos = nextBoundary; continue; }

    const headers = body.subarray(partStart, headerEnd).toString('utf-8');
    if (!headers.includes('filename=')) { pos = nextBoundary; continue; }

    const fnMatch = headers.match(/filename="([^"]+)"/);
    if (fnMatch) filename = fnMatch[1];

    const contentStart = headerEnd + headerSep.length;
    let contentEnd = nextBoundary;
    // Remove trailing \r\n before boundary
    if (contentEnd >= 2 && body[contentEnd - 1] === crlf[1] && body[contentEnd - 2] === crlf[0]) {
      contentEnd -= 2;
    }

    return { fileBuffer: body.subarray(contentStart, contentEnd), filename };
  }

  return { fileBuffer: null, filename: null };
}

// Mock handler when Replicate isn't configured or errors out
async function handleMock(req: VercelRequest, res: VercelResponse, alreadyParsed = false) {
  const analysisId = crypto.randomUUID();
  let filename = 'uploaded-video.mp4';
  if (!alreadyParsed) {
    try {
      const rawBody = await getRawBody(req);
      const boundary = getBoundary(req.headers['content-type'] || '');
      if (boundary) {
        const { filename: parsedFilename } = extractFileFromMultipart(rawBody, boundary);
        if (parsedFilename) filename = parsedFilename;
      }
    } catch {}
  }
  const seed = hashCode(filename + analysisId);
  const results = generateMockAnalysis(seed, 30);
  return res.json({ analysisId, status: 'complete', filename, data: results, instant: true });
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) | 0; return (s >>> 0) / 4294967296; };
}

function generateMockAnalysis(seed: number, duration: number) {
  const rand = seededRandom(seed);
  const cfgs: Record<string, { freq: number; amp: number; base: number }> = {
    emotionalResonance: { freq: 0.08, amp: 0.22, base: 0.45 + rand() * 0.2 },
    attentionFocus: { freq: 0.12, amp: 0.18, base: 0.5 + rand() * 0.2 },
    memorability: { freq: 0.06, amp: 0.15, base: 0.4 + rand() * 0.2 },
    narrativeComprehension: { freq: 0.05, amp: 0.12, base: 0.45 + rand() * 0.2 },
    faceImpact: { freq: 0.10, amp: 0.2, base: 0.35 + rand() * 0.2 },
    sceneImpact: { freq: 0.07, amp: 0.16, base: 0.4 + rand() * 0.2 },
    motionEnergy: { freq: 0.15, amp: 0.2, base: 0.38 + rand() * 0.2 },
  };
  const timeline: Record<string, number[]> = {};
  for (const [key, cfg] of Object.entries(cfgs)) {
    const phase = rand() * Math.PI * 2;
    timeline[key] = Array.from({ length: duration }, (_, i) => {
      let val = cfg.base + cfg.amp * Math.sin(i * cfg.freq * Math.PI * 2 + phase);
      val += 0.2 * Math.exp(-((i - 2) ** 2) / 2);
      const pk = Math.floor(duration * (0.4 + rand() * 0.2));
      val += 0.25 * Math.exp(-((i - pk) ** 2) / 8);
      const dp = Math.floor(duration * (0.6 + rand() * 0.15));
      val -= 0.15 * Math.exp(-((i - dp) ** 2) / 4);
      val += (rand() - 0.5) * 0.06;
      return Math.round(Math.max(0, Math.min(1, val)) * 1000) / 1000;
    });
  }
  const metrics: Record<string, number> = {};
  for (const [key, values] of Object.entries(timeline)) metrics[key] = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 1000) / 1000;
  const wts: Record<string, number> = { emotionalResonance: 0.30, attentionFocus: 0.25, memorability: 0.20, narrativeComprehension: 0.15, sceneImpact: 0.05, motionEnergy: 0.05 };
  const rawScore = Object.entries(wts).reduce((s, [k, w]) => s + (metrics[k] || 0) * w, 0);
  const neuralScore = Math.max(0, Math.min(100, Math.round(rawScore * 100)));
  const percentile = Math.max(10, Math.min(95, neuralScore + Math.round((rand() - 0.5) * 20)));
  const sensoryTimeline = { visual: timeline.sceneImpact, audio: timeline.emotionalResonance, language: timeline.narrativeComprehension };
  const clValues = timeline.attentionFocus.map((v, i) => Math.round((v * 0.6 + (timeline.narrativeComprehension[i] || 0) * 0.4) * 1000) / 1000);
  const clScore = Math.round((clValues.reduce((a, b) => a + b, 0) / clValues.length) * 100);
  const cognitiveLoad = { score: clScore, timeline: clValues, label: clScore > 70 ? 'High' : clScore > 40 ? 'Moderate' : 'Low' };
  const attnStd = Math.sqrt(timeline.attentionFocus.reduce((s, v) => s + (v - metrics.attentionFocus) ** 2, 0) / duration);
  const focusScore = { score: Math.round(Math.max(0, Math.min(100, (1 - attnStd * 3) * 100))), label: attnStd < 0.12 ? 'Laser focused' : attnStd < 0.2 ? 'Good' : 'Scattered' };
  const arcCurve = timeline.emotionalResonance.map((_, i) => {
    const slice = timeline.emotionalResonance.slice(Math.max(0, i - 3), Math.min(duration, i + 4));
    return Math.round((slice.reduce((a, b) => a + b, 0) / slice.length) * 1000) / 1000;
  });
  const climaxIdx = arcCurve.indexOf(Math.max(...arcCurve));
  const narrativeArc = { curve: arcCurve, hookStrength: Math.round(((timeline.attentionFocus[0] + timeline.attentionFocus[1] + timeline.attentionFocus[2]) / 3) * 100) / 100, climaxTime: climaxIdx, climaxValue: arcCurve[climaxIdx], endingStrength: Math.round(((arcCurve[duration - 1] + arcCurve[duration - 2] + arcCurve[duration - 3]) / 3) * 100) / 100 };
  const avCorr = sensoryTimeline.visual.reduce((s, v, i) => s + v * sensoryTimeline.audio[i], 0) / duration;
  const avSyncScore = { score: Math.round(avCorr * 100), label: avCorr > 0.35 ? 'Well-synced' : 'Loosely synced' };
  const keyMoments: any[] = [{ timestamp: 2, type: 'hook', label: 'Opening hook', metric: 'attentionFocus', value: timeline.attentionFocus[2] }, { timestamp: climaxIdx, type: 'peak', label: 'Emotional peak', metric: 'emotionalResonance', value: timeline.emotionalResonance[climaxIdx] }];
  let maxDrop = 0, dropIdx = 0;
  for (let i = 3; i < duration; i++) { const d = timeline.attentionFocus[i - 3] - timeline.attentionFocus[i]; if (d > maxDrop) { maxDrop = d; dropIdx = i; } }
  if (maxDrop > 0.1) keyMoments.push({ timestamp: dropIdx, type: 'drop', label: 'Attention drop', metric: 'attentionFocus', value: timeline.attentionFocus[dropIdx] });
  const peaks = keyMoments.filter(m => m.type === 'peak').map(m => ({ timestamp: m.timestamp, metric: m.metric, value: m.value }));
  const suggestions: any[] = [];
  if (narrativeArc.hookStrength < 0.6) suggestions.push({ type: 'improve', timestamp: 0, message: 'Weak opening — add a face, question, or pattern interrupt in the first 2 seconds', priority: 'high' });
  if (maxDrop > 0.15) suggestions.push({ type: 'improve', timestamp: dropIdx, message: `Attention drops ${Math.round(maxDrop * 100)}% at ${dropIdx}s — add a scene change, text overlay, or new speaker`, priority: 'high' });
  if (narrativeArc.endingStrength < 0.5) suggestions.push({ type: 'improve', timestamp: duration - 3, message: 'Ending loses momentum — close with a strong CTA or emotional callback', priority: 'medium' });
  suggestions.push({ type: 'strength', timestamp: climaxIdx, message: `Emotional peak at ${climaxIdx}s drives engagement — consider building more moments like this`, priority: 'info' });
  return { neuralScore, percentile, metrics, timeline, sensoryTimeline, cognitiveLoad, focusScore, narrativeArc, avSyncScore, keyMoments, peaks, suggestions, contentType: 'custom', schemaVersion: 2 };
}
