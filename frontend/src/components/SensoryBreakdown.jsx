import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

const COLORS = {
  visual: '#00E5A0',
  audio: '#B57FFF',
  language: '#6C9FFF',
};

function buildChartData(sensoryTimeline) {
  if (!sensoryTimeline) return [];

  const visual = sensoryTimeline.visual || [];
  const audio = sensoryTimeline.audio || [];
  const language = sensoryTimeline.language || [];
  const len = Math.max(visual.length, audio.length, language.length);

  const data = [];
  for (let i = 0; i < len; i++) {
    const v = visual[i] || 0;
    const a = audio[i] || 0;
    const l = language[i] || 0;
    const total = v + a + l || 1;
    data.push({
      second: i,
      visual: Math.round((v / total) * 100),
      audio: Math.round((a / total) * 100),
      language: Math.round((l / total) * 100),
    });
  }
  return data;
}

function getValuesAtTime(chartData, currentTime) {
  const idx = Math.min(Math.floor(currentTime || 0), chartData.length - 1);
  if (idx < 0 || !chartData.length) return { visual: 0, audio: 0, language: 0 };
  return chartData[Math.max(0, idx)];
}

export default function SensoryBreakdown({ sensoryTimeline, currentTime }) {
  const chartData = useMemo(() => buildChartData(sensoryTimeline), [sensoryTimeline]);
  const current = getValuesAtTime(chartData, currentTime);

  if (!chartData.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="bg-depth-1 border border-border rounded-lg p-4"
    >
      <h3 className="font-display text-sm font-semibold text-text-bright mb-3">
        Sensory Channels
      </h3>

      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={chartData} stackOffset="expand" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="second"
            tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: '#5E6E87' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}s`}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: '#0C1322',
              border: '1px solid rgba(99,145,255,0.08)',
              borderRadius: 8,
              fontSize: 11,
              fontFamily: 'IBM Plex Mono',
            }}
            labelFormatter={(v) => `${v}s`}
          />
          <Area
            type="monotone"
            dataKey="visual"
            stackId="1"
            stroke="none"
            fill={COLORS.visual}
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="audio"
            stackId="1"
            stroke="none"
            fill={COLORS.audio}
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="language"
            stackId="1"
            stroke="none"
            fill={COLORS.language}
            fillOpacity={0.6}
          />
          {currentTime > 0 && (
            <ReferenceLine
              x={Math.floor(currentTime)}
              stroke="#E8EDF5"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      <p className="font-mono text-xs text-text-dim mt-2">
        Visual {current.visual}% | Audio {current.audio}% | Language {current.language}%
      </p>
    </motion.div>
  );
}
