import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getScoreColor, getScoreLabel } from '../lib/colors';

const REVEAL_RING_R = 90;
const REVEAL_RING_CIRCUMFERENCE = 2 * Math.PI * REVEAL_RING_R;
const COUNT_DURATION = 2000;
const REVEAL_HOLD = 2500;

export default function NeuralScore({ score = 0, verdict, fullscreen = false, onComplete }) {
  if (fullscreen) {
    return (
      <ScoreReveal
        score={score}
        verdict={verdict}
        onComplete={onComplete}
      />
    );
  }

  return <ScoreCompact score={score} />;
}

function ScoreReveal({ score, verdict, onComplete }) {
  const [displayScore, setDisplayScore] = useState(0);
  const [showVerdict, setShowVerdict] = useState(false);
  const timerRef = useRef(null);
  const frameRef = useRef(null);

  const color = getScoreColor(score);
  const ringOffset = REVEAL_RING_CIRCUMFERENCE - (displayScore / 100) * REVEAL_RING_CIRCUMFERENCE;
  const label = verdict || getScoreLabel(score);

  useEffect(() => {
    let start = null;

    function animate(timestamp) {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / COUNT_DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setTimeout(() => setShowVerdict(true), 300);
      }
    }

    frameRef.current = requestAnimationFrame(animate);

    timerRef.current = setTimeout(() => {
      if (onComplete) onComplete();
    }, REVEAL_HOLD + COUNT_DURATION);

    return () => {
      cancelAnimationFrame(frameRef.current);
      clearTimeout(timerRef.current);
    };
  }, [score, onComplete]);

  const ghostColor = '#3A4A63';
  const interpolatedColor = displayScore > 0 ? color : ghostColor;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-void"
    >
      {/* Score number */}
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="font-display font-black tabular-nums leading-none"
        style={{
          fontSize: '120px',
          color: interpolatedColor,
          textShadow: `0 0 40px ${color}40, 0 0 80px ${color}20`,
          transition: 'color 0.3s ease',
        }}
      >
        {displayScore}
      </motion.span>

      {/* Circular ring */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6"
      >
        <svg
          viewBox="0 0 200 200"
          style={{ width: 200, height: 200 }}
          className="-rotate-90"
        >
          <circle
            cx="100"
            cy="100"
            r={REVEAL_RING_R}
            fill="none"
            stroke="rgba(58, 74, 99, 0.2)"
            strokeWidth="3"
          />
          <circle
            cx="100"
            cy="100"
            r={REVEAL_RING_R}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={REVEAL_RING_CIRCUMFERENCE}
            strokeDashoffset={ringOffset}
            style={{
              transition: 'stroke-dashoffset 0.3s ease-out',
              filter: `drop-shadow(0 0 10px ${color}50)`,
            }}
          />
        </svg>
      </motion.div>

      {/* Verdict text */}
      {showVerdict && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6 font-body text-base text-text-main max-w-md text-center leading-relaxed"
        >
          {label}
        </motion.p>
      )}
    </motion.div>
  );
}

function ScoreCompact({ score }) {
  const [displayScore, setDisplayScore] = useState(0);
  const color = getScoreColor(score);

  useEffect(() => {
    let frame;
    let start = null;
    const duration = 1200;

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
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-1"
    >
      <div className="flex items-baseline gap-1">
        <span
          className="font-display text-3xl font-bold tabular-nums"
          style={{ color }}
        >
          {displayScore}
        </span>
        <span className="text-text-dim text-sm">/100</span>
      </div>
      <div className="h-[3px] w-full max-w-[200px] rounded-full bg-depth-3 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}40`,
          }}
        />
      </div>
    </motion.div>
  );
}
