import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
// Score color helper — will import from lib/colors.js when it's updated
function getScoreColor(score) {
  if (score >= 70) return '#00E5A0';
  if (score >= 45) return '#FFB547';
  return '#FF5C5C';
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const diff = Math.floor((Date.now() / 1000) - timestamp);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function truncateFilename(name, maxLen = 24) {
  if (!name) return 'Untitled';
  if (name.length <= maxLen) return name;
  const ext = name.slice(name.lastIndexOf('.'));
  const base = name.slice(0, maxLen - ext.length - 3);
  return `${base}...${ext}`;
}

export default function AnalysisHistory({ analyses, activeId, onSelect }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (!analyses || analyses.length < 2) return null;

  const handleSelect = (analysisId) => {
    onSelect(analysisId);
    setOpen(false);
  };

  return (
    <div className="relative inline-block mb-4" ref={containerRef}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 font-mono text-xs text-text-dim hover:text-text-main transition-colors px-3 py-1.5 rounded-lg border border-border hover:border-border-active"
      >
        {analyses.length} scans
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{ transformOrigin: 'top left' }}
            className="absolute top-full left-0 mt-2 z-50 min-w-[280px] max-h-[300px] overflow-y-auto bg-depth-2 border border-border-active rounded-lg shadow-2xl"
          >
            {analyses.map((analysis) => {
              const isActive = analysis.analysisId === activeId;
              const score = analysis.neuralScore;
              const scoreColor = score != null ? getScoreColor(Math.round(score)) : '#3A4A63';

              return (
                <button
                  key={analysis.analysisId}
                  onClick={() => handleSelect(analysis.analysisId)}
                  className={`
                    w-full flex items-center gap-3 py-3 px-4 text-left transition-colors
                    hover:bg-depth-3
                    ${isActive ? 'bg-depth-3 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'}
                  `}
                >
                  {/* Filename */}
                  <span className="font-body text-sm text-text-main flex-1 truncate">
                    {truncateFilename(analysis.filename)}
                  </span>

                  {/* Score badge */}
                  {score != null ? (
                    <span
                      className="font-display font-bold text-sm tabular-nums"
                      style={{ color: scoreColor }}
                    >
                      {Math.round(score)}
                    </span>
                  ) : (
                    <span className="text-text-ghost text-sm">--</span>
                  )}

                  {/* Relative time */}
                  <span className="font-mono text-xs text-text-ghost shrink-0">
                    {formatRelativeTime(analysis.completedAt)}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
