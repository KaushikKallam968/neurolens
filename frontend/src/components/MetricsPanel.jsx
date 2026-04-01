import { motion } from 'framer-motion';
import {
  Heart, Eye, Brain, BookOpen, User, Clapperboard, Zap,
} from 'lucide-react';
import { metricColors, metricLabels, hexToRgba } from '../lib/colors';

// Descriptions for each metric — will move to lib/colors.js when it's updated
const metricDescriptions = {
  emotionalResonance: 'How strongly the content triggers emotional brain regions',
  attentionFocus: 'Active engagement and focus from prefrontal cortex',
  memorability: 'Hippocampal encoding — likelihood of being remembered',
  narrativeComprehension: 'Language processing and narrative understanding',
  faceImpact: 'Fusiform face area activation from on-screen faces',
  sceneImpact: 'Visual cortex response to environments and scenes',
  motionEnergy: 'Neural response to dynamic movement and kinetic energy',
};

const metricIcons = {
  emotionalResonance: Heart,
  attentionFocus: Eye,
  memorability: Brain,
  narrativeComprehension: BookOpen,
  faceImpact: User,
  sceneImpact: Clapperboard,
  motionEnergy: Zap,
};

function Sparkline({ data, color, width = 60, height = 24 }) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / range) * height}`)
    .join(' ');

  return (
    <svg width={width} height={height} className="shrink-0 opacity-60">
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
  const description = metricDescriptions[metricKey];
  const displayValue = Math.round(value * 100);

  const fullData = timeline?.[metricKey] || [];
  const sparklineData = fullData.filter((_, i) => i % 2 === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="bg-depth-1 border border-border rounded-lg p-4 group hover:border-border-active transition-all duration-300 cursor-default"
      style={{
        '--card-glow': hexToRgba(color, 0.06),
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `inset 0 0 30px ${hexToRgba(color, 0.06)}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Top row: icon + label */}
          <div className="flex items-center gap-2 mb-3">
            <Icon size={16} style={{ color }} className="shrink-0" />
            <span className="font-body text-xs font-medium uppercase tracking-widest text-text-dim">
              {label}
            </span>
          </div>

          {/* Score */}
          <div className="flex items-baseline gap-1 mb-2">
            <span className="font-display text-3xl font-bold" style={{ color }}>
              {displayValue}
            </span>
            <span className="text-text-ghost text-sm">/100</span>
          </div>

          {/* Description */}
          <p className="text-text-dim text-xs leading-relaxed">
            {description}
          </p>
        </div>

        {/* Sparkline on right */}
        <div className="ml-3 mt-6">
          <Sparkline data={sparklineData} color={color} />
        </div>
      </div>
    </motion.div>
  );
}

export default function MetricsPanel({ metrics, timeline }) {
  if (!metrics) return null;

  const metricKeys = Object.keys(metricLabels);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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
