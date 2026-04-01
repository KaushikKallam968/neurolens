import { motion } from 'framer-motion';
import { Film, Clock, Plus } from 'lucide-react';

function getScoreColor(score) {
  if (score == null) return '#6B7280';
  if (score < 30) return '#FF6B6B';
  if (score < 50) return '#F59E0B';
  if (score < 70) return '#00D4FF';
  return '#10B981';
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const diff = Math.floor((Date.now() / 1000) - timestamp);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function truncateFilename(name, maxLen = 18) {
  if (!name) return 'Untitled';
  if (name.length <= maxLen) return name;
  const ext = name.slice(name.lastIndexOf('.'));
  const base = name.slice(0, maxLen - ext.length - 3);
  return `${base}...${ext}`;
}

function AnalysisCard({ analysis, isActive, onSelect }) {
  const score = analysis.neuralScore;
  const scoreColor = getScoreColor(score);

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(analysis.analysisId)}
      className={`
        shrink-0 flex flex-col gap-2 p-3 rounded-xl border backdrop-blur-sm
        transition-colors duration-200 text-left min-w-[160px] max-w-[180px]
        ${isActive
          ? 'border-nl-cyan bg-nl-cyan/10 shadow-[0_0_12px_rgba(0,212,255,0.15)]'
          : 'border-card-border bg-card/30 hover:border-card-border-hover hover:bg-card/50'}
      `}
    >
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${isActive ? 'bg-nl-cyan/20' : 'bg-card/60'}`}>
          <Film size={14} className={isActive ? 'text-nl-cyan' : 'text-text-muted'} />
        </div>
        <span className="text-xs text-text-primary font-medium truncate">
          {truncateFilename(analysis.filename)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        {score != null ? (
          <span
            className="text-lg font-bold tabular-nums"
            style={{ color: scoreColor }}
          >
            {Math.round(score)}
          </span>
        ) : (
          <span className="text-sm text-text-muted">--</span>
        )}

        <div className="flex items-center gap-1 text-text-muted">
          <Clock size={10} />
          <span className="text-[10px]">
            {formatRelativeTime(analysis.completedAt)}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

export default function AnalysisHistory({ analyses, activeId, onSelect, onNewAnalysis }) {
  if (!analyses || analyses.length < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-5 rounded-xl border border-card-border bg-card/20 backdrop-blur-sm p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Analysis History
        </h3>
        <button
          onClick={onNewAnalysis}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
            border border-card-border text-text-secondary
            hover:border-nl-cyan/30 hover:text-nl-cyan transition-all"
        >
          <Plus size={12} />
          New
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {analyses.map((analysis) => (
          <AnalysisCard
            key={analysis.analysisId}
            analysis={analysis}
            isActive={analysis.analysisId === activeId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </motion.div>
  );
}
