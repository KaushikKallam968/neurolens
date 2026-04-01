import { motion } from 'framer-motion';
import { Brain, Crosshair, Waves } from 'lucide-react';
import { getScoreColor } from '../lib/colors';

function getPercentileColor(percentile) {
  const top = 100 - percentile;
  if (top <= 30) return '#00E5A0';
  if (top <= 60) return '#FFB547';
  return '#5E6E87';
}

function getCognitiveColor(score) {
  if (score < 45) return '#00E5A0';
  if (score < 65) return '#FFB547';
  return '#FF5C5C';
}

function Divider() {
  return <div className="w-px h-6 bg-border shrink-0" />;
}

function Pill({ icon: Icon, score, label, color }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} style={{ color }} />
      <span className="font-mono text-xs text-text-main" style={{ color }}>
        {score}
      </span>
      <span className="font-mono text-xs text-text-dim">
        {label}
      </span>
    </div>
  );
}

export default function ScoreSummaryBar({ neuralScore, percentile, cognitiveLoad, focusScore, avSyncScore }) {
  const scoreColor = getScoreColor(neuralScore || 0);
  const topPercent = 100 - (percentile || 0);
  const percentileColor = getPercentileColor(percentile || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-wrap items-center gap-6 bg-depth-1 border border-border rounded-lg px-5 py-3"
    >
      {/* Neural Score */}
      <div className="flex items-baseline gap-1">
        <span
          className="font-display text-2xl font-bold"
          style={{ color: scoreColor }}
        >
          {neuralScore || 0}
        </span>
        <span className="text-text-ghost text-sm">/100</span>
      </div>

      <Divider />

      {/* Percentile */}
      <span
        className="font-mono text-xs bg-depth-2 rounded px-2 py-1"
        style={{ color: percentileColor }}
      >
        Top {topPercent}%
      </span>

      <Divider />

      {/* Cognitive Load */}
      <Pill
        icon={Brain}
        score={cognitiveLoad?.score ?? '--'}
        label={cognitiveLoad?.label || 'N/A'}
        color={getCognitiveColor(cognitiveLoad?.score || 0)}
      />

      <Divider />

      {/* Focus */}
      <Pill
        icon={Crosshair}
        score={focusScore?.score ?? '--'}
        label={focusScore?.label || 'N/A'}
        color={getScoreColor(focusScore?.score || 0)}
      />

      <Divider />

      {/* AV Sync */}
      <Pill
        icon={Waves}
        score={avSyncScore?.score ?? '--'}
        label={avSyncScore?.label || 'N/A'}
        color={getScoreColor(avSyncScore?.score || 0)}
      />
    </motion.div>
  );
}
