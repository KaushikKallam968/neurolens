import { useMemo } from 'react';
import { getScoreColor } from '../lib/colors';

// One-liner synthesized summary of the analysis results
export default function Verdict({ neuralScore, timeline, keyMoments, className = '' }) {
  const text = useMemo(() => {
    if (!timeline || !neuralScore) return null;

    const attention = timeline.attentionFocus || [];
    const emotion = timeline.emotionalResonance || [];
    if (attention.length === 0) return null;

    // Find hook strength (first 3 seconds)
    const hookAvg = attention.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, attention.length);
    const hookStrong = hookAvg > 0.65;

    // Find attention drop-off
    const midStart = Math.floor(attention.length * 0.4);
    const midEnd = Math.floor(attention.length * 0.7);
    const midAvg = attention.slice(midStart, midEnd).reduce((a, b) => a + b, 0) / (midEnd - midStart || 1);
    const hasMidDrop = midAvg < 0.45;

    // Find emotional peak
    const emotionMax = Math.max(...emotion);
    const hasPeak = emotionMax > 0.75;

    // Ending strength
    const endAvg = attention.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, attention.length);
    const strongEnding = endAvg > 0.6;

    // Construct verdict
    const parts = [];
    if (hookStrong) {
      parts.push('Your hook grabs attention effectively');
    } else {
      parts.push('Your opening needs a stronger hook');
    }

    if (hasMidDrop) {
      parts.push('but viewers disengage mid-video');
    } else if (hasPeak) {
      parts.push('and emotional peaks maintain engagement');
    }

    if (strongEnding) {
      parts.push('with a solid close');
    } else if (parts.length < 2) {
      parts.push('but the ending could be stronger');
    }

    return parts.join(' ') + '.';
  }, [neuralScore, timeline, keyMoments]);

  if (!text) return null;

  const color = getScoreColor(neuralScore);

  return (
    <p className={`font-body text-sm leading-relaxed ${className}`} style={{ color }}>
      {text}
    </p>
  );
}
