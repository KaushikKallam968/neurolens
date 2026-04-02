import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STAGE_LABELS = {
  extracting_events: 'Extracting audio & transcribing speech',
  events_extracted: 'Processing video frames',
  extracting_features: 'Extracting visual & audio features',
  predicting: 'Predicting neural activation',
  computing_metrics: 'Computing engagement metrics',
};

const FALLBACK_STAGES = [
  { label: 'Extracting visual features', threshold: 25 },
  { label: 'Mapping audio response', threshold: 50 },
  { label: 'Predicting neural activation', threshold: 75 },
  { label: 'Computing engagement score', threshold: 100 },
];

function getLabel(stage, progress) {
  if (stage && STAGE_LABELS[stage]) return STAGE_LABELS[stage];
  for (const s of FALLBACK_STAGES) {
    if (progress < s.threshold) return s.label;
  }
  return FALLBACK_STAGES[FALLBACK_STAGES.length - 1].label;
}

export default function ProcessingOverlay({ progress = 0, stage = null }) {
  const label = useMemo(() => getLabel(stage, progress), [stage, progress]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(6, 11, 20, 0.95)' }}
    >
      {/* Scan line animation */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ opacity: 0.06 }}
      >
        <div
          className="absolute left-0 right-0 h-[1px]"
          style={{
            background: 'linear-gradient(90deg, transparent, #6C9FFF, transparent)',
            animation: 'scan-line 3s linear infinite',
          }}
        />
      </div>

      <div className="flex flex-col items-center gap-10 relative z-10">
        {/* Stage text */}
        <div className="h-8 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="font-display text-lg text-text-bright text-center"
            >
              {label}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="w-[400px] max-w-[80vw]">
          <div className="h-[2px] w-full rounded-full bg-depth-3 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                boxShadow: '0 0 12px rgba(108, 159, 255, 0.4), 0 0 4px rgba(108, 159, 255, 0.6)',
              }}
            />
          </div>
        </div>

        {/* Percentage */}
        <p className="font-mono text-xs text-text-dim">
          {Math.round(progress)}%
        </p>
      </div>
    </motion.div>
  );
}
