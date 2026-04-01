import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Zap, ArrowRight } from 'lucide-react';

const severityConfig = {
  critical: {
    label: 'CRITICAL',
    color: '#FF5C5C',
    Icon: AlertTriangle,
  },
  warning: {
    label: 'WARNING',
    color: '#FFB547',
    Icon: AlertCircle,
  },
  strength: {
    label: 'STRENGTH',
    color: '#00E5A0',
    Icon: Zap,
  },
};

function getSeverity(suggestion) {
  if (suggestion.severity) return suggestion.severity;
  const typeToPriority = {
    attentionDrop: 'critical',
    weakHook: 'critical',
    emotionalFlatline: 'warning',
    weakEnding: 'warning',
  };
  return typeToPriority[suggestion.type] || 'strength';
}

function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function InsightCard({ suggestion, onSeek }) {
  const severity = getSeverity(suggestion);
  const config = severityConfig[severity] || severityConfig.strength;
  const { Icon, color, label } = config;

  return (
    <div
      className="flex items-start gap-4 py-3 px-4"
      style={{ borderLeft: `2px solid ${color}` }}
    >
      {/* Timestamp */}
      <button
        onClick={() => onSeek?.(suggestion.time)}
        className="shrink-0 font-mono text-xs bg-depth-2 rounded px-2 py-1 text-primary hover:bg-depth-3 transition-colors cursor-pointer"
      >
        {formatTimestamp(suggestion.time || 0)}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Icon size={12} style={{ color }} className="shrink-0" />
          <span
            className="font-mono text-[10px] tracking-widest font-medium uppercase"
            style={{ color }}
          >
            {label}
          </span>
        </div>
        <p className="text-text-main text-sm leading-relaxed">
          {suggestion.message}
        </p>
        {suggestion.action && (
          <p className="text-text-dim text-xs italic mt-1 flex items-center gap-1">
            <ArrowRight size={10} className="shrink-0" />
            {suggestion.action}
          </p>
        )}
      </div>
    </div>
  );
}

export default function EditingSuggestions({ suggestions, onSeek }) {
  if (!suggestions?.length) return null;

  // Sort: critical first, then warning, then strength; within same priority sort by time
  const priorityOrder = { critical: 0, warning: 1, strength: 2 };
  const sorted = [...suggestions].sort((a, b) => {
    const pa = priorityOrder[getSeverity(a)] ?? 2;
    const pb = priorityOrder[getSeverity(b)] ?? 2;
    if (pa !== pb) return pa - pb;
    return (a.time || 0) - (b.time || 0);
  });

  const hasCritical = sorted.some((s) => getSeverity(s) === 'critical');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="bg-depth-1 border border-border rounded-lg p-5"
    >
      <h3 className="font-display text-sm font-semibold text-text-bright mb-4">
        Insights
      </h3>

      {hasCritical && (
        <div className="flex items-center gap-2 mb-3 px-4 py-2 rounded bg-[rgba(255,92,92,0.06)]">
          <AlertTriangle size={12} className="text-score-low" />
          <span className="font-mono text-[10px] tracking-widest text-score-low uppercase">
            Critical issues detected
          </span>
        </div>
      )}

      <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
        {sorted.map((s, i) => (
          <InsightCard
            key={`${s.time}-${s.type}-${i}`}
            suggestion={s}
            onSeek={onSeek}
          />
        ))}
      </div>
    </motion.div>
  );
}
