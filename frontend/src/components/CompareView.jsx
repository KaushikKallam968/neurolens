import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { metricColors, metricLabels, getScoreColor, hexToRgba } from '../lib/colors';

function generateVerdict(a, b) {
  const scoreA = a?.neuralScore || 0;
  const scoreB = b?.neuralScore || 0;
  const diff = Math.abs(scoreA - scoreB);
  const winner = scoreA >= scoreB ? 'A' : 'B';
  const loser = winner === 'A' ? 'B' : 'A';

  const metricsA = a?.metrics || {};
  const metricsB = b?.metrics || {};
  const aWins = [];
  const bWins = [];

  Object.keys(metricLabels).forEach((key) => {
    const valA = metricsA[key]?.score || 0;
    const valB = metricsB[key]?.score || 0;
    if (valA > valB) aWins.push(metricLabels[key]);
    else if (valB > valA) bWins.push(metricLabels[key]);
  });

  if (diff === 0) {
    return `Both videos scored identically at ${scoreA}. Video A leads in ${aWins.join(', ') || 'no metrics'}, while Video B leads in ${bWins.join(', ') || 'no metrics'}.`;
  }

  const winnerWins = winner === 'A' ? aWins : bWins;
  const loserWins = winner === 'A' ? bWins : aWins;

  return `Video ${winner} scores ${diff} point${diff !== 1 ? 's' : ''} higher overall. Stronger ${winnerWins.slice(0, 3).join(', ') || 'performance'}${loserWins.length > 0 ? `, but Video ${loser} has better ${loserWins.slice(0, 3).join(', ')}` : ''}.`;
}

function ScoreBar({ score, label }) {
  const color = getScoreColor(score);
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-body text-sm text-text-main truncate">{label}</span>
        <span className="font-display text-xl font-bold" style={{ color }}>
          {score}
        </span>
      </div>
      <div className="h-2 rounded-full bg-depth-3 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function MetricRow({ metricKey, scoreA, scoreB }) {
  const label = metricLabels[metricKey] || metricKey;
  const color = metricColors[metricKey] || '#6C9FFF';
  const delta = scoreA - scoreB;
  const deltaColor = delta > 0 ? '#00E5A0' : delta < 0 ? '#FF5C5C' : '#5E6E87';
  const deltaText = delta > 0 ? `+${delta}` : `${delta}`;

  return (
    <div className="py-2.5 border-b border-border last:border-b-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-body text-sm text-text-main">{label}</span>
        <span
          className="font-mono text-xs font-medium"
          style={{ color: deltaColor }}
        >
          {delta !== 0 ? deltaText : '='}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {/* Bar A */}
        <div className="flex-1">
          <div className="h-1.5 rounded-full bg-depth-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${scoreA}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
            />
          </div>
        </div>
        <span className="font-mono text-xs text-text-dim w-6 text-right">{scoreA}</span>
        <span className="font-mono text-xs text-text-ghost">vs</span>
        <span className="font-mono text-xs text-text-dim w-6 text-left">{scoreB}</span>
        {/* Bar B */}
        <div className="flex-1">
          <div className="h-1.5 rounded-full bg-depth-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${scoreB}%` }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
              className="h-full rounded-full"
              style={{ backgroundColor: hexToRgba(color, 0.5) }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompareView({ analysisA, analysisB, onClose }) {
  const dataA = analysisA?.data || {};
  const dataB = analysisB?.data || {};
  const scoreA = dataA.neuralScore || 0;
  const scoreB = dataB.neuralScore || 0;
  const nameA = analysisA?.fileName || 'Video A';
  const nameB = analysisB?.fileName || 'Video B';
  const metricsA = dataA.metrics || {};
  const metricsB = dataB.metrics || {};

  const verdict = generateVerdict(dataA, dataB);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(6, 11, 20, 0.95)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-depth-1 border border-border rounded-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <span className="font-display text-lg font-bold text-text-bright">
            Compare Mode
          </span>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-text-dim text-xs font-mono hover:border-border-active hover:text-text-main transition-all"
          >
            <X size={13} />
            Close
          </button>
        </div>

        {/* Score comparison */}
        <div className="grid grid-cols-2 gap-6 px-6 py-5 border-b border-border">
          <ScoreBar score={scoreA} label={nameA} />
          <ScoreBar score={scoreB} label={nameB} />
        </div>

        {/* Metric comparison */}
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-body text-xs text-text-ghost uppercase tracking-wider mb-3">
            Metric Breakdown
          </h3>
          {Object.keys(metricLabels).map((key) => (
            <MetricRow
              key={key}
              metricKey={key}
              scoreA={metricsA[key]?.score || 0}
              scoreB={metricsB[key]?.score || 0}
            />
          ))}
        </div>

        {/* Verdict */}
        <div className="px-6 py-5">
          <h3 className="font-body text-xs text-text-ghost uppercase tracking-wider mb-2">
            Verdict
          </h3>
          <p className="font-body text-sm text-text-main leading-relaxed">
            {verdict}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
