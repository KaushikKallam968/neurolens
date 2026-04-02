import { useRef } from 'react';
import { motion } from 'framer-motion';
import { getScoreColor } from '../lib/colors';
import { Card } from './ui';

// Horizontal scrollable strip of video frame thumbnails at peak/drop moments
export default function KeyMomentThumbnails({ keyMoments = [], onSeek, className = '' }) {
  const scrollRef = useRef(null);

  if (keyMoments.length === 0) return null;

  return (
    <Card padding={false} className={className}>
      <div className="p-4 pb-0">
        <h3 className="font-display text-sm font-semibold text-text-bright">Key Moments</h3>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-4 py-3 scrollbar-thin"
        role="list"
        aria-label="Key moments in the video"
      >
        {keyMoments.map((moment, i) => (
          <motion.button
            key={`${moment.timestamp}-${i}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSeek?.(moment.timestamp)}
            className="shrink-0 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-[var(--radius-sm)]"
            role="listitem"
            aria-label={`${moment.label} at ${moment.timestamp} seconds`}
          >
            <div className="w-[160px] rounded-[var(--radius-sm)] border border-border
              bg-depth-2 overflow-hidden group-hover:border-border-active transition-colors">
              {/* Thumbnail placeholder — real thumbnails come from Replicate in SP4 */}
              <div className="h-[90px] bg-depth-3 flex items-center justify-center relative">
                <span className="font-mono text-lg text-text-ghost">{moment.timestamp}s</span>
                {/* Type indicator */}
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: moment.type === 'peak'
                      ? '#00E5A0' : moment.type === 'drop'
                      ? '#FF5C5C' : '#FFB547',
                    boxShadow: `0 0 6px ${moment.type === 'peak' ? 'rgba(0, 229, 160, 0.5)' : moment.type === 'drop' ? 'rgba(255, 92, 92, 0.5)' : 'rgba(255, 181, 71, 0.5)'}`,
                  }}
                />
              </div>
              <div className="p-2">
                <p className="text-[10px] font-body text-text-main truncate">{moment.label}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[9px] font-mono text-text-dim">{moment.metric}</span>
                  {moment.value && (
                    <span
                      className="text-[9px] font-mono font-semibold"
                      style={{ color: getScoreColor(moment.value * 100) }}
                    >
                      {Math.round(moment.value * 100)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </Card>
  );
}
