import { useRef, useEffect, useMemo } from 'react';
import { getScoreColor } from '../lib/colors';

// Compact horizontal bar showing engagement intensity over time
export default function HeatStrip({ timeline, currentTime = 0, onClick, className = '' }) {
  const canvasRef = useRef(null);

  // Compute combined engagement per-second
  const intensities = useMemo(() => {
    if (!timeline) return [];
    const keys = ['emotionalResonance', 'attentionFocus', 'memorability'];
    const available = keys.filter(k => timeline[k]?.length > 0);
    if (available.length === 0) return [];

    const len = timeline[available[0]].length;
    return Array.from({ length: len }, (_, i) => {
      const sum = available.reduce((acc, k) => acc + (timeline[k][i] || 0), 0);
      return sum / available.length;
    });
  }, [timeline]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || intensities.length === 0) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);

    const segmentWidth = width / intensities.length;

    // Draw segments
    intensities.forEach((value, i) => {
      const color = getScoreColor(value * 100);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.3 + value * 0.7;
      ctx.fillRect(i * segmentWidth, 0, segmentWidth + 1, height);
    });

    // Draw playhead
    if (currentTime >= 0 && currentTime < intensities.length) {
      ctx.globalAlpha = 1;
      const x = (currentTime / intensities.length) * width;
      ctx.fillStyle = '#E8EDF5';
      ctx.fillRect(x - 1, 0, 2, height);
    }
  }, [intensities, currentTime]);

  const handleClick = (e) => {
    if (!onClick || intensities.length === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / rect.width) * intensities.length;
    onClick(Math.floor(time));
  };

  if (intensities.length === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className={`w-full h-3 rounded-[var(--radius-full)] cursor-pointer ${className}`}
      style={{ imageRendering: 'pixelated' }}
      aria-label="Engagement intensity timeline"
      role="img"
    />
  );
}
