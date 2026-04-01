import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceDot, ResponsiveContainer } from 'recharts';

export default function NarrativeArc({ narrativeArc }) {
  if (!narrativeArc?.curve?.length) return null;

  const { curve, hookStrength, climaxTime, climaxValue, endingStrength } = narrativeArc;

  const chartData = useMemo(() => {
    return curve.map((val, i) => ({ index: i, value: val }));
  }, [curve]);

  const lastIndex = chartData.length - 1;
  const climaxIndex = typeof climaxTime === 'number' ? Math.min(climaxTime, lastIndex) : Math.floor(lastIndex / 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="bg-depth-1 border border-border rounded-lg p-4"
    >
      <h3 className="font-display text-sm font-semibold text-text-bright mb-3">
        Narrative Arc
      </h3>

      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
          <defs>
            <linearGradient id="narrativeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6C9FFF" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#6C9FFF" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="index"
            tick={false}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide domain={[0, 1]} />
          <Tooltip
            contentStyle={{
              background: '#0C1322',
              border: '1px solid rgba(99,145,255,0.08)',
              borderRadius: 8,
              fontSize: 11,
              fontFamily: 'IBM Plex Mono',
            }}
            formatter={(val) => [`${Math.round(val * 100)}%`, 'Intensity']}
            labelFormatter={() => ''}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#6C9FFF"
            strokeWidth={2}
            fill="url(#narrativeGradient)"
          />
          {/* Climax dot */}
          <ReferenceDot
            x={climaxIndex}
            y={climaxValue ?? curve[climaxIndex] ?? 0}
            r={4}
            fill="#6C9FFF"
            stroke="#E8EDF5"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Annotations below chart */}
      <div className="flex justify-between items-center mt-2 font-mono text-xs">
        <span className="text-text-dim">
          Hook: <span className="text-primary">{Math.round((hookStrength || 0) * 100)}%</span>
        </span>
        <span className="text-text-dim">
          Climax <span className="inline-block w-2 h-2 rounded-full bg-primary mx-1 align-middle" />
        </span>
        <span className="text-text-dim">
          End: <span className="text-primary">{Math.round((endingStrength || 0) * 100)}%</span>
        </span>
      </div>
    </motion.div>
  );
}
