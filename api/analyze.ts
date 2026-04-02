import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock TribeV2 inference endpoint for Vercel deployment.
// Returns brain-predicted engagement metrics seeded from the filename
// for reproducible results. Same output format as the real Replicate
// Cog model — swap to real inference by routing uploads through
// /api/upload + /api/trigger-analysis when the Cog model is deployed.

export const config = {
  api: { bodyParser: { sizeLimit: '50mb' } },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const analysisId = crypto.randomUUID();
  // Extract filename from multipart or use default
  const filename = extractFilename(req) || 'uploaded-video.mp4';
  const seed = hashCode(filename + analysisId);

  const results = generateAnalysis(seed, 30);

  return res.json({
    analysisId,
    status: 'complete',
    filename,
    data: results,
    instant: true,
  });
}

function extractFilename(req: VercelRequest): string | null {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart')) {
    // Try to extract from content-disposition in the raw body
    const body = typeof req.body === 'string' ? req.body : '';
    const match = body.match(/filename="([^"]+)"/);
    if (match) return match[1];
  }
  return null;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}

function generateAnalysis(seed: number, duration: number) {
  const rand = seededRandom(seed);

  const metricConfigs: Record<string, { freq: number; amp: number; base: number }> = {
    emotionalResonance: { freq: 0.08, amp: 0.22, base: 0.45 + rand() * 0.2 },
    attentionFocus: { freq: 0.12, amp: 0.18, base: 0.5 + rand() * 0.2 },
    memorability: { freq: 0.06, amp: 0.15, base: 0.4 + rand() * 0.2 },
    narrativeComprehension: { freq: 0.05, amp: 0.12, base: 0.45 + rand() * 0.2 },
    faceImpact: { freq: 0.10, amp: 0.2, base: 0.35 + rand() * 0.2 },
    sceneImpact: { freq: 0.07, amp: 0.16, base: 0.4 + rand() * 0.2 },
    motionEnergy: { freq: 0.15, amp: 0.2, base: 0.38 + rand() * 0.2 },
  };

  // Generate per-second timelines
  const timeline: Record<string, number[]> = {};
  for (const [key, cfg] of Object.entries(metricConfigs)) {
    const phase = rand() * Math.PI * 2;
    timeline[key] = Array.from({ length: duration }, (_, i) => {
      let val = cfg.base + cfg.amp * Math.sin(i * cfg.freq * Math.PI * 2 + phase);
      // Hook at t=1-3
      val += 0.2 * Math.exp(-((i - 2) ** 2) / 2);
      // Peak at 40-60%
      const peakTime = Math.floor(duration * (0.4 + rand() * 0.2));
      val += 0.25 * Math.exp(-((i - peakTime) ** 2) / 8);
      // Dip at 60-75%
      const dipTime = Math.floor(duration * (0.6 + rand() * 0.15));
      val -= 0.15 * Math.exp(-((i - dipTime) ** 2) / 4);
      // Noise
      val += (rand() - 0.5) * 0.06;
      return Math.round(Math.max(0, Math.min(1, val)) * 1000) / 1000;
    });
  }

  // Summary metrics (mean values)
  const metrics: Record<string, number> = {};
  for (const [key, values] of Object.entries(timeline)) {
    metrics[key] = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 1000) / 1000;
  }

  // Neural score (weighted composite)
  const weights = { emotionalResonance: 0.30, attentionFocus: 0.25, memorability: 0.20, narrativeComprehension: 0.15, sceneImpact: 0.05, motionEnergy: 0.05 };
  const rawScore = Object.entries(weights).reduce((sum, [k, w]) => sum + (metrics[k] || 0) * w, 0);
  const neuralScore = Math.max(0, Math.min(100, Math.round(rawScore * 100)));

  // Percentile (simulated)
  const percentile = Math.max(10, Math.min(95, neuralScore + Math.round((rand() - 0.5) * 20)));

  // Sensory breakdown
  const sensoryTimeline = {
    visual: timeline.sceneImpact,
    audio: timeline.emotionalResonance,
    language: timeline.narrativeComprehension,
  };

  // Cognitive load
  const clValues = timeline.attentionFocus.map((v, i) => Math.round((v * 0.6 + (timeline.narrativeComprehension[i] || 0) * 0.4) * 1000) / 1000);
  const clScore = Math.round((clValues.reduce((a, b) => a + b, 0) / clValues.length) * 100);
  const cognitiveLoad = { score: clScore, timeline: clValues, label: clScore > 70 ? 'High' : clScore > 40 ? 'Moderate' : 'Low' };

  // Focus score
  const attnStd = Math.sqrt(timeline.attentionFocus.reduce((s, v) => s + (v - metrics.attentionFocus) ** 2, 0) / duration);
  const focusScore = { score: Math.round(Math.max(0, Math.min(100, (1 - attnStd * 3) * 100))), label: attnStd < 0.12 ? 'Laser focused' : attnStd < 0.2 ? 'Good' : 'Scattered' };

  // Narrative arc
  const arcCurve = timeline.emotionalResonance.map((v, i) => {
    const w = 3;
    const start = Math.max(0, i - w);
    const end = Math.min(duration, i + w + 1);
    const slice = timeline.emotionalResonance.slice(start, end);
    return Math.round((slice.reduce((a, b) => a + b, 0) / slice.length) * 1000) / 1000;
  });
  const climaxIdx = arcCurve.indexOf(Math.max(...arcCurve));
  const narrativeArc = {
    curve: arcCurve,
    hookStrength: Math.round(((timeline.attentionFocus[0] + timeline.attentionFocus[1] + timeline.attentionFocus[2]) / 3) * 100) / 100,
    climaxTime: climaxIdx,
    climaxValue: arcCurve[climaxIdx],
    endingStrength: Math.round(((arcCurve[duration - 1] + arcCurve[duration - 2] + arcCurve[duration - 3]) / 3) * 100) / 100,
  };

  // AV sync
  const avCorr = sensoryTimeline.visual.reduce((s, v, i) => s + v * sensoryTimeline.audio[i], 0) / duration;
  const avSyncScore = { score: Math.round(avCorr * 100), label: avCorr > 0.35 ? 'Well-synced' : 'Loosely synced' };

  // Key moments
  const keyMoments = [
    { timestamp: 2, type: 'hook', label: 'Opening hook', metric: 'attentionFocus', value: timeline.attentionFocus[2] },
    { timestamp: climaxIdx, type: 'peak', label: 'Emotional peak', metric: 'emotionalResonance', value: timeline.emotionalResonance[climaxIdx] },
  ];
  // Find biggest drop
  let maxDrop = 0, dropIdx = 0;
  for (let i = 3; i < duration; i++) {
    const drop = timeline.attentionFocus[i - 3] - timeline.attentionFocus[i];
    if (drop > maxDrop) { maxDrop = drop; dropIdx = i; }
  }
  if (maxDrop > 0.1) {
    keyMoments.push({ timestamp: dropIdx, type: 'drop', label: 'Attention drop', metric: 'attentionFocus', value: timeline.attentionFocus[dropIdx] });
  }

  // Peaks
  const peaks = keyMoments.filter(m => m.type === 'peak').map(m => ({ timestamp: m.timestamp, metric: m.metric, value: m.value }));

  // Suggestions
  const suggestions = [];
  if (narrativeArc.hookStrength < 0.6) {
    suggestions.push({ type: 'improve', timestamp: 0, message: 'Weak opening — add a face, question, or pattern interrupt in the first 2 seconds', priority: 'high' });
  }
  if (maxDrop > 0.15) {
    suggestions.push({ type: 'improve', timestamp: dropIdx, message: `Attention drops ${Math.round(maxDrop * 100)}% at ${dropIdx}s — add a scene change, text overlay, or new speaker`, priority: 'high' });
  }
  if (narrativeArc.endingStrength < 0.5) {
    suggestions.push({ type: 'improve', timestamp: duration - 3, message: 'Ending loses momentum — close with a strong CTA or emotional callback', priority: 'medium' });
  }
  suggestions.push({ type: 'strength', timestamp: climaxIdx, message: `Emotional peak at ${climaxIdx}s drives engagement — consider building more moments like this`, priority: 'info' });

  return {
    neuralScore, percentile, metrics, timeline, sensoryTimeline,
    cognitiveLoad, focusScore, narrativeArc, avSyncScore,
    keyMoments, peaks, suggestions,
    contentType: 'custom', schemaVersion: 2,
  };
}
