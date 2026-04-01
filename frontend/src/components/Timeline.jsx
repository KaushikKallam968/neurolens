import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { metricColors, metricLabels, hexToRgba } from '../lib/colors';

const ALL_METRICS = Object.keys(metricLabels);

const SCORE_HIGH = '#00E5A0';
const SCORE_MID = '#FFB547';
const SCORE_LOW = '#FF5C5C';
const PRIMARY_COLOR = '#6C9FFF';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getHeatColor(avgScore) {
  if (avgScore > 0.7) return SCORE_HIGH;
  if (avgScore > 0.4) return SCORE_MID;
  return SCORE_LOW;
}

function HeatStrip({ data, currentTime, totalLength, onSeek }) {
  const heatData = useMemo(() => {
    if (!data || !totalLength) return [];
    const firstKey = ALL_METRICS.find((k) => data[k]?.length);
    if (!firstKey) return [];
    const len = data[firstKey].length;

    return Array.from({ length: len }, (_, i) => {
      let sum = 0;
      let count = 0;
      for (const key of ALL_METRICS) {
        if (data[key]?.[i] != null) {
          sum += data[key][i];
          count++;
        }
      }
      return count > 0 ? sum / count : 0;
    });
  }, [data, totalLength]);

  const gradientStops = useMemo(() => {
    if (!heatData.length) return '';
    return heatData
      .map((val, i) => {
        const pct = (i / (heatData.length - 1)) * 100;
        return `${getHeatColor(val)} ${pct.toFixed(1)}%`;
      })
      .join(', ');
  }, [heatData]);

  const playheadPct = totalLength > 0 ? (currentTime / totalLength) * 100 : 0;

  const handleClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const time = pct * totalLength;
    onSeek?.(Math.max(0, Math.min(time, totalLength)));
  }, [totalLength, onSeek]);

  if (!heatData.length) return null;

  return (
    <div
      className="w-full h-4 rounded-sm relative cursor-pointer mb-4"
      style={{ background: `linear-gradient(to right, ${gradientStops})` }}
      onClick={handleClick}
    >
      {/* Playhead */}
      {currentTime > 0 && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white"
          style={{ left: `${playheadPct}%` }}
        />
      )}
    </div>
  );
}

function MetricToggle({ metricKey, active, onToggle }) {
  const color = metricColors[metricKey];
  const label = metricLabels[metricKey];

  return (
    <button
      onClick={() => onToggle(metricKey)}
      className={`
        rounded-full px-3 py-1 text-xs font-mono uppercase tracking-wider
        transition-all duration-200 border
        ${active
          ? ''
          : 'bg-depth-2 text-text-dim border-border hover:text-text-main'}
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
    <div className="bg-depth-2 border border-border-active rounded-lg p-3 shadow-2xl">
      <p className="font-mono text-text-dim text-xs mb-2">
        {formatTime(parseInt(label, 10))}
      </p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 py-0.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-text-main">
            {metricLabels[entry.dataKey]}
          </span>
          <span className="text-xs font-medium ml-auto" style={{ color: entry.color }}>
            {(entry.value * 100).toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Timeline({ data, currentTime = 0, onSeek }) {
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

  const totalLength = chartData.length;

  const toggleMetric = (key) => {
    setActiveMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const xTickFormatter = (val) => {
    const sec = parseInt(val, 10);
    if (sec % 5 !== 0) return '';
    return formatTime(sec);
  };

  if (!chartData.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="bg-depth-1 border border-border rounded-lg p-5"
    >
      <h3 className="font-display text-sm font-semibold text-text-bright mb-4">
        Neural Timeline
      </h3>

      {/* Heat Strip */}
      <HeatStrip
        data={data}
        currentTime={currentTime}
        totalLength={totalLength}
        onSeek={onSeek}
      />

      {/* Metric toggle pills */}
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

      {/* Chart */}
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
              tick={{ fontSize: 10, fill: '#3A4A63', fontFamily: "'IBM Plex Mono', monospace" }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(99,145,255,0.08)' }}
              tickFormatter={xTickFormatter}
              interval="preserveStartEnd"
            />

            <Tooltip content={<CustomTooltip />} />

            {currentTime > 0 && (
              <ReferenceLine
                x={`${Math.floor(currentTime)}`}
                stroke={PRIMARY_COLOR}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            )}

            {ALL_METRICS.filter((k) => activeMetrics.has(k)).map((key) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={metricColors[key]}
                strokeWidth={1.5}
                fill={`url(#grad-${key})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: metricColors[key] }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
