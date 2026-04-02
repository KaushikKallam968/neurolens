import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from './ui';

// 2D emotion chart: valence (positive/negative) vs arousal (intensity)
// Derived from brain region activations
export default function ValenceArousal({ timeline, currentTime = 0, className = '' }) {
  const data = useMemo(() => {
    if (!timeline) return [];

    const emotion = timeline.emotionalResonance || [];
    const attention = timeline.attentionFocus || [];
    const memory = timeline.memorability || [];

    if (emotion.length === 0) return [];

    return emotion.map((val, i) => {
      // Valence: approach (vmPFC, TPJ) vs avoidance (amygdala, insula)
      // Approximated from emotion + comprehension vs pure attention
      const comprehension = timeline.narrativeComprehension?.[i] || 0.5;
      const valence = (val * 0.6 + comprehension * 0.4) * 2 - 1; // -1 to 1

      // Arousal: activation magnitude across all regions
      const arousal = (attention[i] || 0.5) * 0.5 + val * 0.3 + (memory[i] || 0.5) * 0.2;

      return { valence, arousal, time: i };
    });
  }, [timeline]);

  if (data.length === 0) return null;

  const currentPoint = data[Math.min(Math.floor(currentTime), data.length - 1)];

  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm font-semibold text-text-bright">Emotion Map</h3>
        <span className="font-mono text-xs text-text-dim">Valence / Arousal</span>
      </div>

      <div className="relative w-full aspect-square max-h-[240px] mx-auto">
        {/* Quadrant labels */}
        <span className="absolute top-1 left-1 text-[9px] font-mono text-text-ghost">Tense</span>
        <span className="absolute top-1 right-1 text-[9px] font-mono text-text-ghost">Excited</span>
        <span className="absolute bottom-1 left-1 text-[9px] font-mono text-text-ghost">Sad</span>
        <span className="absolute bottom-1 right-1 text-[9px] font-mono text-text-ghost">Calm</span>

        {/* Grid */}
        <svg className="w-full h-full" viewBox="0 0 200 200">
          {/* Background */}
          <rect x="0" y="0" width="200" height="200" fill="#0C1322" rx="8" />

          {/* Grid lines */}
          <line x1="100" y1="0" x2="100" y2="200" stroke="rgba(99, 145, 255, 0.1)" />
          <line x1="0" y1="100" x2="200" y2="100" stroke="rgba(99, 145, 255, 0.1)" />

          {/* Axis labels */}
          <text x="100" y="196" textAnchor="middle" fill="#3A4A63" fontSize="8" fontFamily="monospace">Valence +</text>
          <text x="4" y="104" fill="#3A4A63" fontSize="8" fontFamily="monospace">Arousal +</text>

          {/* Trail (last 10 points) */}
          {data.length > 1 && (
            <polyline
              fill="none"
              stroke="rgba(108, 159, 255, 0.2)"
              strokeWidth="1"
              points={data.map(d =>
                `${(d.valence + 1) * 100},${(1 - d.arousal) * 200}`
              ).join(' ')}
            />
          )}

          {/* Current position */}
          {currentPoint && (
            <motion.circle
              cx={(currentPoint.valence + 1) * 100}
              cy={(1 - currentPoint.arousal) * 200}
              r="6"
              fill="#6C9FFF"
              stroke="#E8EDF5"
              strokeWidth="1.5"
              initial={false}
              animate={{
                cx: (currentPoint.valence + 1) * 100,
                cy: (1 - currentPoint.arousal) * 200,
              }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              style={{ filter: 'drop-shadow(0 0 6px rgba(108, 159, 255, 0.5))' }}
            />
          )}
        </svg>
      </div>
    </Card>
  );
}
