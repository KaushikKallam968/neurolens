import { motion } from 'framer-motion';
import {
  Heart, Eye, Brain, BookOpen, User, Clapperboard, Zap,
} from 'lucide-react';
import { metricColors, metricLabels, hexToRgba } from '../lib/colors';

const metricIcons = {
  emotionalResonance: Heart,
  attentionFocus: Eye,
  memorability: Brain,
  narrativeComprehension: BookOpen,
  faceImpact: User,
  sceneImpact: Clapperboard,
  motionEnergy: Zap,
};

function Sparkline({ data, color, width = 80, height = 24 }) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / range) * height}`)
    .join(' ');

  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MetricCard({ metricKey, value, timeline, index }) {
  const Icon = metricIcons[metricKey];
  const color = metricColors[metricKey];
  const label = metricLabels[metricKey];
  const displayValue = Math.round(value * 100);

  const fullData = timeline?.[metricKey] || [];
  const sparklineData = fullData.filter((_, i) => i % 2 === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="relative rounded-xl border border-card-border bg-card/40 backdrop-blur-sm p-4 overflow-hidden group hover:border-card-border-hover transition-colors"
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 20% 50%, ${hexToRgba(color, 0.06)}, transparent 70%)`,
        }}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: hexToRgba(color, 0.1) }}
          >
            <Icon size={16} style={{ color }} />
          </div>
          <div>
            <p className="text-xs text-text-muted">{label}</p>
            <p className="text-2xl font-bold mt-0.5" style={{ color }}>
              {displayValue}
            </p>
          </div>
        </div>
        <Sparkline data={sparklineData} color={color} />
      </div>
    </motion.div>
  );
}

export default function MetricsPanel({ metrics, timeline }) {
  if (!metrics) return null;

  const metricKeys = Object.keys(metricLabels);

  return (
    <div className="grid grid-cols-2 gap-3">
      {metricKeys.map((key, i) => (
        <MetricCard
          key={key}
          metricKey={key}
          value={metrics[key] || 0}
          timeline={timeline}
          index={i}
        />
      ))}
    </div>
  );
}
