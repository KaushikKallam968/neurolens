import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import ScoreSummaryBar from '../components/ScoreSummaryBar';
import Verdict from '../components/Verdict';
import HeatStrip from '../components/HeatStrip';
import RetentionCurve from '../components/RetentionCurve';
import { Card, Skeleton } from '../components/ui';
import { getScoreColor } from '../lib/colors';

export default function SharePage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchShareData() {
      try {
        const response = await fetch(`/api/share/${token}`);
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || 'Share link not found');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchShareData();
  }, [token]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto mt-12 px-5">
        <Skeleton width="60%" height="2rem" className="mb-4" />
        <Skeleton width="100%" height="64px" className="mb-4" />
        <Skeleton width="100%" height="200px" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="font-display text-2xl text-text-bright">Link Unavailable</h1>
        <p className="text-sm text-text-dim">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const scoreColor = getScoreColor(data.neuralScore);

  return (
    <div className="max-w-3xl mx-auto mt-8 px-5 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-2 h-2 rounded-full bg-primary" style={{ boxShadow: '0 0 8px rgba(108, 159, 255, 0.5)' }} />
        <span className="font-display text-lg font-bold">
          <span className="text-text-bright">Neuro</span>
          <span className="text-primary">Lens</span>
        </span>
        <span className="text-xs font-mono text-text-ghost ml-auto">Shared Report</span>
      </div>

      {/* Filename + score */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-xl font-bold text-text-bright">{data.filename}</h1>
          <span className="font-display text-3xl font-bold" style={{ color: scoreColor }}>
            {data.neuralScore}
          </span>
        </div>

        {/* Content type */}
        {data.contentType && data.contentType !== 'custom' && (
          <p className="text-xs font-mono text-text-dim mb-4">Content type: {data.contentType}</p>
        )}
      </motion.div>

      {/* Score summary (if full visibility) */}
      {data.metrics && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <Card className="mb-4">
            <h3 className="font-display text-sm font-semibold text-text-bright mb-3">Metrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(data.metrics).map(([key, value]) => (
                <div key={key} className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-text-ghost uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="font-display text-lg font-bold" style={{ color: getScoreColor(value * 100) }}>
                    {Math.round(value * 100)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Timeline / Retention (if full visibility) */}
      {data.timeline && (
        <>
          <HeatStrip timeline={data.timeline} className="mb-4" />
          <RetentionCurve timeline={data.timeline} className="mb-4" />
        </>
      )}

      {/* Suggestions */}
      {data.suggestions && data.suggestions.length > 0 && (
        <Card>
          <h3 className="font-display text-sm font-semibold text-text-bright mb-3">Suggestions</h3>
          <div className="flex flex-col gap-2">
            {data.suggestions.map((s, i) => (
              <p key={i} className="text-sm text-text-main font-body">{s.message}</p>
            ))}
          </div>
        </Card>
      )}

      {/* Footer */}
      <p className="text-center text-[10px] text-text-ghost mt-12">
        Analyzed by NeuroLens — Brain-predicted engagement metrics powered by TribeV2
      </p>
    </div>
  );
}
