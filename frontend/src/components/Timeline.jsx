import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { metricColors, metricLabels, hexToRgba } from '../lib/colors';

const ALL_METRICS = Object.keys(metricLabels);

function MetricToggle({ metricKey, active, onToggle }) {
  const color = metricColors[metricKey];
  const label = metricLabels[metricKey];

  return (
    <button
      onClick={() => onToggle(metricKey)}
      className={`
        px-3 py-1.5 rounded-full text-xs font-medium
        transition-all duration-200 border
        ${active
          ? 'border-transparent'
          : 'border-card-border text-text-muted hover:text-text-secondary'}
      `}
      style={active ? {
        backgroundColor: hexToRgba(color, 0.15),
        color: color,
        borderColor: hexToRgba(color, 0.3),
      } : {}}
    >
      {label}
    </button>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-surface/95 backdrop-blur-md border border-card-border rounded-lg p-3 shadow-xl">
      <p className="text-xs text-text-muted mb-2">{label}s</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 py-0.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-text-secondary">
            {metricLabels[entry.dataKey]}
          </span>
          <span className="text-xs font-medium ml-auto" style={{ color: entry.color }}>
            {(entry.value * 100).toFixed(0)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Timeline({ data, currentTime = 0 }) {
  const [activeMetrics, setActiveMetrics] = useState(
    new Set(['emotionalResonance', 'attentionFocus', 'memorability'])
  );

  const chartData = useMemo(() => {
    if (!data) return [];
    const firstKey = Object.keys(data)[0];
    if (!firstKey) return [];
    const length = data[firstKey].length;
    return Array.from({ length }, (_, i) => {
      const point = { time: `${i}` };
      for (const key of ALL_METRICS) {
        point[key] = data[key]?.[i] ?? 0;
      }
      return point;
    });
  }, [data]);

  const toggleMetric = (key) => {
    setActiveMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (!chartData.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="rounded-xl border border-card-border bg-card/30 backdrop-blur-sm p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">
          Neural Timeline
        </h3>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {ALL_METRICS.map((key) => (
          <MetricToggle
            key={key}
            metricKey={key}
            active={activeMetrics.has(key)}
            onToggle={toggleMetric}
          />
        ))}
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {ALL_METRICS.map((key) => (
                <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={metricColors[key]} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={metricColors[key]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>

            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
            />
            <YAxis
              domain={[0, 1]}
              tick={{ fontSize: 11, fill: '#6B7280' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v * 100).toFixed(0)}`}
            />

            <Tooltip content={<CustomTooltip />} />

            {currentTime > 0 && (
              <ReferenceLine
                x={currentTime.toFixed(1)}
                stroke="#00D4FF"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
            )}

            {ALL_METRICS.filter((k) => activeMetrics.has(k)).map((key) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={metricColors[key]}
                strokeWidth={2}
                fill={`url(#grad-${key})`}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0, fill: metricColors[key] }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
