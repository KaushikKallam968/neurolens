import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from './ui';

const STAGE_LABELS = {
  extracting_events: 'Extracting audio & transcribing speech',
  events_extracted: 'Processing video frames',
  extracting_features: 'Extracting visual & audio features',
  predicting: 'Predicting neural activation',
  computing_metrics: 'Computing engagement metrics',
  complete: 'Analysis complete',
};

const FALLBACK_STAGES = [
  { label: 'Preparing GPU environment', threshold: 15 },
  { label: 'Extracting visual features', threshold: 35 },
  { label: 'Mapping audio response', threshold: 55 },
  { label: 'Predicting neural activation', threshold: 80 },
  { label: 'Computing engagement score', threshold: 100 },
];

function getLabel(stage, progress) {
  if (stage && STAGE_LABELS[stage]) return STAGE_LABELS[stage];
  for (const s of FALLBACK_STAGES) {
    if (progress < s.threshold) return s.label;
  }
  return FALLBACK_STAGES[FALLBACK_STAGES.length - 1].label;
}

export default function InlineProgress({ progress = 0, stage = null }) {
  const label = useMemo(() => getLabel(stage, progress), [stage, progress]);

  return (
    <div className="flex flex-col gap-6 py-12">
      {/* Skeleton dashboard preview */}
      <div className="flex flex-col gap-4 opacity-40">
        <div className="flex gap-4">
          <Skeleton width="100%" height="64px" rounded="var(--radius-lg)" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <Skeleton width="100%" height="280px" rounded="var(--radius-lg)" />
          </div>
          <div className="lg:col-span-3">
            <Skeleton width="100%" height="280px" rounded="var(--radius-lg)" />
          </div>
        </div>
      </div>

      {/* Progress overlay */}
      <div className="flex flex-col items-center gap-4 -mt-48 relative z-10">
        <div className="bg-depth-1/90 backdrop-blur-md rounded-[var(--radius-lg)] border border-border p-8 flex flex-col items-center gap-4 max-w-md w-full">
          <AnimatePresence mode="wait">
            <motion.p
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="font-display text-base text-text-bright text-center"
            >
              {label}
            </motion.p>
          </AnimatePresence>

          <div className="w-full">
            <div className="h-[3px] w-full rounded-full bg-depth-3 overflow-hidden">
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

          <p className="font-mono text-xs text-text-dim">{Math.round(progress)}%</p>
        </div>
      </div>
    </div>
  );
}
