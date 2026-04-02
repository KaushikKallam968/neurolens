// Pre-computed demo analysis for first-time visitor onboarding
// Users explore a real dashboard before uploading their own content

const DEMO_DURATION = 30;

function generateTimeline() {
  const metrics = {};
  const configs = {
    emotionalResonance: { freq: 0.08, amp: 0.22, base: 0.55 },
    attentionFocus: { freq: 0.12, amp: 0.18, base: 0.6 },
    memorability: { freq: 0.06, amp: 0.15, base: 0.5 },
    narrativeComprehension: { freq: 0.05, amp: 0.12, base: 0.55 },
    faceImpact: { freq: 0.10, amp: 0.2, base: 0.45 },
    sceneImpact: { freq: 0.07, amp: 0.16, base: 0.5 },
    motionEnergy: { freq: 0.15, amp: 0.2, base: 0.48 },
  };

  for (const [key, cfg] of Object.entries(configs)) {
    metrics[key] = Array.from({ length: DEMO_DURATION }, (_, i) => {
      let val = cfg.base + cfg.amp * Math.sin(i * cfg.freq * Math.PI * 2);
      // Hook at t=2
      if (i <= 3) val += 0.15 * Math.exp(-((i - 2) ** 2) / 2);
      // Peak at t=15
      val += 0.2 * Math.exp(-((i - 15) ** 2) / 8);
      // Dip at t=20
      val -= 0.15 * Math.exp(-((i - 20) ** 2) / 4);
      return Math.round(Math.max(0, Math.min(1, val)) * 1000) / 1000;
    });
  }
  return metrics;
}

const timeline = generateTimeline();

function meanOf(arr) {
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 1000) / 1000;
}

export const DEMO_ANALYSIS = {
  analysisId: 'demo-analysis',
  filename: 'demo-product-launch.mp4',
  status: 'complete',
  data: {
    neuralScore: 72,
    percentile: 68,
    metrics: Object.fromEntries(
      Object.entries(timeline).map(([k, v]) => [k, meanOf(v)])
    ),
    timeline,
    sensoryTimeline: {
      visual: timeline.sceneImpact,
      audio: timeline.emotionalResonance,
      language: timeline.narrativeComprehension,
    },
    cognitiveLoad: { score: 62, timeline: timeline.attentionFocus, label: 'Moderate' },
    focusScore: { score: 68, label: 'Good' },
    narrativeArc: {
      curve: timeline.emotionalResonance,
      hookStrength: 0.78,
      climaxTime: 15,
      climaxValue: 0.87,
      endingStrength: 0.62,
    },
    avSyncScore: { score: 79, label: 'Well-synced' },
    keyMoments: [
      { timestamp: 2, type: 'hook', label: 'Strong opening hook', metric: 'attentionFocus', value: 0.85 },
      { timestamp: 8, type: 'peak', label: 'Face recognition spike', metric: 'faceImpact', value: 0.82 },
      { timestamp: 15, type: 'peak', label: 'Emotional climax', metric: 'emotionalResonance', value: 0.87 },
      { timestamp: 20, type: 'drop', label: 'Attention drop', metric: 'attentionFocus', value: 0.38 },
      { timestamp: 27, type: 'peak', label: 'Memorable closing', metric: 'memorability', value: 0.75 },
    ],
    peaks: [
      { timestamp: 2, metric: 'attentionFocus', value: 0.85 },
      { timestamp: 15, metric: 'emotionalResonance', value: 0.87 },
    ],
    suggestions: [
      { type: 'improve', timestamp: 20, message: 'Attention drops at 20s — add a pattern interrupt (scene change, new speaker, or motion)', priority: 'high' },
      { type: 'improve', timestamp: 0, message: 'Hook is strong but could use a face in the first 2 frames for higher face response', priority: 'medium' },
      { type: 'strength', timestamp: 15, message: 'Emotional climax at 15s is well-timed — this moment will be remembered', priority: 'info' },
    ],
    verdict: 'Strong hook and emotional climax, but mid-video attention dip needs a scene change.',
  },
};

export const DEMO_STORAGE_KEY = 'neurolens_demo_shown';
