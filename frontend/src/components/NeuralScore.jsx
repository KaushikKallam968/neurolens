import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getScoreColor(score) {
  if (score < 30) return '#FF6B6B';
  if (score < 50) return '#F59E0B';
  if (score < 70) return '#00D4FF';
  return '#10B981';
}

function getScoreLabel(score) {
  if (score < 30) return 'Low engagement — significant room for improvement';
  if (score < 50) return 'Moderate engagement with clear optimization opportunities';
  if (score < 70) return 'Strong emotional engagement with room for attention optimization';
  if (score < 85) return 'Excellent neural response across most dimensions';
  return 'Exceptional — peak neural engagement detected';
}

export default function NeuralScore({ score = 0 }) {
  const [displayScore, setDisplayScore] = useState(0);
  const color = getScoreColor(score);
  const offset = CIRCUMFERENCE - (displayScore / 100) * CIRCUMFERENCE;

  useEffect(() => {
    let frame;
    let start = null;
    const duration = 1500;

    function animate(timestamp) {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          <circle
            cx="100" cy="100" r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="8"
          />
          <circle
            cx="100" cy="100" r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 0.3s ease-out',
              filter: `drop-shadow(0 0 8px ${color}40)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-5xl font-bold tabular-nums"
            style={{ color }}
          >
            {displayScore}
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-text-secondary mb-1">
          Neural Engagement Score
        </p>
        <p className="text-xs text-text-muted max-w-[240px] leading-relaxed">
          {getScoreLabel(score)}
        </p>
      </div>
    </motion.div>
  );
}
