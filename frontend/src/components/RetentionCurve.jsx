import { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card } from './ui';

// YouTube Analytics-style predicted retention curve derived from attention timeline
export default function RetentionCurve({ timeline, onSeek, className = '' }) {
  const data = useMemo(() => {
    if (!timeline?.attentionFocus?.length) return [];

    const attention = timeline.attentionFocus;
    let retention = 100;

    return attention.map((value, i) => {
      // Simulated retention: cumulative decay based on attention
      // Low attention = faster viewer drop-off
      const dropRate = (1 - value) * 3; // 0-3% drop per second
      retention = Math.max(0, retention - dropRate);

      return {
        time: i,
        label: `${i}s`,
        retention: Math.round(retention * 10) / 10,
        attention: Math.round(value * 100),
      };
    });
  }, [timeline]);

  if (data.length === 0) return null;

  // Find drop-off points (>5% drop in 3 seconds)
  const dropPoints = [];
  for (let i = 3; i < data.length; i++) {
    const drop = data[i - 3].retention - data[i].retention;
    if (drop > 5) {
      dropPoints.push({ time: i, drop: Math.round(drop * 10) / 10 });
    }
  }

  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm font-semibold text-text-bright">Predicted Retention</h3>
        <span className="font-mono text-xs text-text-dim">
          {Math.round(data[data.length - 1]?.retention || 0)}% at end
        </span>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} onClick={(e) => e?.activePayload && onSeek?.(e.activePayload[0]?.payload?.time)}>
            <defs>
              <linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6C9FFF" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#6C9FFF" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 145, 255, 0.06)" />
            <XAxis
              dataKey="label"
              stroke="#3A4A63"
              tick={{ fill: '#5E6E87', fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              stroke="#3A4A63"
              tick={{ fill: '#5E6E87', fontSize: 10 }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                background: '#0C1322', border: '1px solid rgba(99, 145, 255, 0.15)',
                borderRadius: '8px', fontSize: '12px',
              }}
              formatter={(value) => [`${value}%`, 'Retention']}
            />
            <Area
              type="monotone"
              dataKey="retention"
              stroke="#6C9FFF"
              strokeWidth={2}
              fill="url(#retentionGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {dropPoints.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {dropPoints.slice(0, 3).map((point) => (
            <button
              key={point.time}
              onClick={() => onSeek?.(point.time)}
              className="px-2 py-1 text-[10px] font-mono text-score-low bg-score-low/10
                border border-score-low/20 rounded-[var(--radius-full)]
                hover:bg-score-low/20 transition-colors cursor-pointer"
            >
              -{point.drop}% at {point.time}s
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
