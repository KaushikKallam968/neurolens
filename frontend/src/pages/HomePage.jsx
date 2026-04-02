import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, Film, Award, Zap, Play } from 'lucide-react';
import { useAnalysisContext } from '../contexts/AnalysisContext';
import Upload from '../components/Upload';
import { Button, Card, Modal, Input } from '../components/ui';
import { getScoreColor } from '../lib/colors';
import { DEMO_ANALYSIS, DEMO_STORAGE_KEY } from '../lib/demoData';

export default function HomePage() {
  const navigate = useNavigate();
  const { analyses, uploadVideo, selectAnalysis } = useAnalysisContext();
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [campaignName, setCampaignName] = useState('');

  // Global stats
  const stats = useMemo(() => {
    if (analyses.length === 0) return null;
    const scores = analyses.filter(a => a.neuralScore).map(a => a.neuralScore);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const best = analyses.find(a => a.neuralScore === bestScore);
    return {
      avgScore,
      totalVideos: analyses.length,
      bestScore,
      bestFilename: best?.filename || 'N/A',
    };
  }, [analyses]);

  const handleUpload = async (file) => {
    const analysisId = await uploadVideo(file);
    if (analysisId) {
      navigate(`/analysis/${analysisId}`);
    }
  };

  const handleSelect = (analysisId) => {
    selectAnalysis(analysisId);
    navigate(`/analysis/${analysisId}`);
  };

  const handleCreateCampaign = useCallback(() => {
    if (!campaignName.trim()) return;
    // In v2 with Edge Functions, this would POST to /api/campaigns
    // For now, navigate to campaign page with the name
    setShowNewCampaign(false);
    setCampaignName('');
  }, [campaignName]);

  // Check if first visit — show demo prompt
  const [showDemoBanner, setShowDemoBanner] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem(DEMO_STORAGE_KEY) && analyses.length === 0) {
        setShowDemoBanner(true);
      }
    } catch {}
  }, [analyses.length]);

  const handleTryDemo = useCallback(() => {
    localStorage.setItem(DEMO_STORAGE_KEY, 'true');
    setShowDemoBanner(false);
    // Set demo analysis into context and navigate
    selectAnalysis('demo-analysis');
    navigate('/analysis/demo-analysis');
  }, [selectAnalysis, navigate]);

  const dismissDemo = useCallback(() => {
    localStorage.setItem(DEMO_STORAGE_KEY, 'true');
    setShowDemoBanner(false);
  }, []);

  return (
    <div className="mt-8">
      {/* Demo banner for first-time visitors */}
      {showDemoBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-5 rounded-[20px] border border-primary/10 bg-primary/[0.06] backdrop-blur-xl flex items-center justify-between shadow-[0_8px_32px_rgba(108,159,255,0.06),inset_0_1px_0_rgba(255,255,255,0.05)]"
        >
          <div>
            <h3 className="font-display text-base font-semibold text-text-bright">See what NeuroLens can do</h3>
            <p className="text-sm text-text-dim mt-1">Explore a pre-analyzed demo before uploading your own content.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={dismissDemo}>Skip</Button>
            <Button variant="primary" size="sm" onClick={handleTryDemo}>
              <Play size={14} />
              Try Demo
            </Button>
          </div>
        </motion.div>
      )}

      {/* Global stats */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8"
        >
          <StatCard icon={<TrendingUp size={16} />} label="Avg Score" value={stats.avgScore} color={getScoreColor(stats.avgScore)} />
          <StatCard icon={<Film size={16} />} label="Total Videos" value={stats.totalVideos} color="#6C9FFF" />
          <StatCard icon={<Award size={16} />} label="Best Score" value={stats.bestScore} color={getScoreColor(stats.bestScore)} />
          <StatCard icon={<Zap size={16} />} label="Best Video" value={stats.bestFilename} isText color="#FFB547" />
        </motion.div>
      )}

      {/* Upload + History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Upload onUpload={handleUpload} />
        </div>

        <div className="flex flex-col gap-4">
          <Button variant="secondary" size="lg" className="w-full" onClick={() => setShowNewCampaign(true)}>
            <Plus size={16} />
            New Campaign
          </Button>

          {/* Recent analyses */}
          {analyses.length > 0 && (
            <Card>
              <h3 className="font-display text-sm font-semibold text-text-bright mb-3">Recent Analyses</h3>
              <div className="flex flex-col gap-2">
                {analyses.slice(0, 8).map((analysis) => (
                  <button
                    key={analysis.analysisId}
                    onClick={() => handleSelect(analysis.analysisId)}
                    className="flex items-center justify-between p-2 rounded-[var(--radius-sm)]
                      hover:bg-depth-2 transition-colors text-left group"
                  >
                    <span className="text-sm text-text-main truncate max-w-[200px] group-hover:text-text-bright transition-colors">
                      {analysis.filename}
                    </span>
                    {analysis.neuralScore && (
                      <span
                        className="font-mono text-sm font-semibold"
                        style={{ color: getScoreColor(analysis.neuralScore) }}
                      >
                        {analysis.neuralScore}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* New Campaign Modal */}
      <Modal open={showNewCampaign} onClose={() => setShowNewCampaign(false)} title="New Campaign">
        <form onSubmit={(e) => { e.preventDefault(); handleCreateCampaign(); }} className="flex flex-col gap-4">
          <Input
            label="Campaign Name"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="Q2 Ad Creative Tests"
            autoFocus
          />
          <Button type="submit" variant="primary" disabled={!campaignName.trim()}>
            Create Campaign
          </Button>
        </form>
      </Modal>
    </div>
  );
}

function StatCard({ icon, label, value, color, isText = false }) {
  return (
    <Card className="flex items-center gap-3">
      <div className="p-2 rounded-[var(--radius-sm)] bg-depth-2" style={{ color }}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-mono text-text-ghost uppercase tracking-wider">{label}</p>
        {isText ? (
          <p className="text-xs text-text-main truncate max-w-[120px]">{value}</p>
        ) : (
          <p className="font-display text-lg font-bold" style={{ color }}>{value}</p>
        )}
      </div>
    </Card>
  );
}
