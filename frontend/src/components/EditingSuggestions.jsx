import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, Zap, Info } from 'lucide-react';
import { colors } from '../lib/colors';

const typeConfig = {
  attentionDrop: {
    label: 'Attention Drop',
    color: colors.amber,
    Icon: AlertTriangle,
  },
  emotionalFlatline: {
    label: 'Emotional Flatline',
    color: colors.coral,
    Icon: AlertTriangle,
  },
  weakHook: {
    label: 'Weak Hook',
    color: colors.orange,
    Icon: Zap,
  },
  weakEnding: {
    label: 'Weak Ending',
    color: colors.amber,
    Icon: TrendingUp,
  },
  info: {
    label: 'Insight',
    color: colors.cyan,
    Icon: Info,
  },
};

function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function SuggestionCard({ suggestion, index, onSeek }) {
  const config = typeConfig[suggestion.type] || typeConfig.info;
  const { Icon, color, label } = config;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="flex gap-4 p-4 rounded-xl border border-card-border bg-card/30 hover:bg-card/50 transition-colors group"
    >
      <button
        onClick={() => onSeek?.(suggestion.time)}
        className="shrink-0 px-2.5 py-1 rounded-lg bg-surface text-xs font-mono font-medium text-nl-cyan hover:bg-nl-cyan/10 transition-colors"
      >
        {formatTimestamp(suggestion.time || 0)}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Icon size={13} style={{ color }} />
          <span
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color }}
          >
            {label}
          </span>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          {suggestion.message}
        </p>
      </div>
    </motion.div>
  );
}

export default function EditingSuggestions({ suggestions, onSeek }) {
  if (!suggestions?.length) return null;

  const sorted = [...suggestions].sort((a, b) => a.time - b.time);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="rounded-xl border border-card-border bg-card/30 backdrop-blur-sm p-5"
    >
      <h3 className="text-sm font-semibold text-text-primary mb-4">
        Editing Suggestions
      </h3>
      <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
        {sorted.map((s, i) => (
          <SuggestionCard
            key={`${s.time}-${i}`}
            suggestion={s}
            index={i}
            onSeek={onSeek}
          />
        ))}
      </div>
    </motion.div>
  );
}
