import { motion } from 'framer-motion';

const typeColors = {
  hookSuccess: '#00E5A0',
  strongEnding: '#00E5A0',
  peakEngagement: '#00E5A0',
  hookWeak: '#FF5C5C',
  attentionDrop: '#FF5C5C',
};

function getTypeColor(type) {
  return typeColors[type] || '#FFB547';
}

function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function MomentCard({ moment, onSeek }) {
  const color = getTypeColor(moment.type);

  return (
    <div
      className="shrink-0 bg-depth-2 rounded-lg px-3 py-2 min-w-[140px]"
      style={{ borderLeft: `2px solid ${color}` }}
    >
      <button
        onClick={() => onSeek?.(moment.time)}
        className="font-mono text-xs text-primary hover:underline cursor-pointer"
      >
        {formatTimestamp(moment.time || 0)}
      </button>
      <p className="font-body text-sm text-text-bright mt-1 leading-snug">
        {moment.label}
      </p>
      <span
        className="inline-block font-mono text-[10px] tracking-wide uppercase mt-1.5 px-1.5 py-0.5 rounded"
        style={{ color, backgroundColor: `${color}15` }}
      >
        {moment.type}
      </span>
    </div>
  );
}

export default function KeyMoments({ keyMoments, onSeek }) {
  if (!keyMoments?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="bg-depth-1 border border-border rounded-lg p-4"
    >
      <h3 className="font-display text-sm font-semibold text-text-bright mb-3">
        Key Moments
      </h3>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {keyMoments.map((moment, i) => (
          <MomentCard
            key={`${moment.time}-${moment.type}-${i}`}
            moment={moment}
            onSeek={onSeek}
          />
        ))}
      </div>
    </motion.div>
  );
}
