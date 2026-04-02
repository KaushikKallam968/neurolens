import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useAnalysisContext } from '../contexts/AnalysisContext';
import BatchUpload from '../components/BatchUpload';
import ContentTypeSelector from '../components/ContentTypeSelector';
import { Breadcrumb, Card, Button } from '../components/ui';
import { getScoreColor } from '../lib/colors';

export default function CampaignPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { analyses, selectAnalysis, uploadVideo } = useAnalysisContext();
  const [showUpload, setShowUpload] = useState(false);

  // In v2 with Supabase, campaigns come from the campaigns table
  // For now, show all analyses as a campaign-like view
  const videos = analyses;

  const handleSelect = (analysisId) => {
    selectAnalysis(analysisId);
    navigate(`/analysis/${analysisId}`);
  };

  const handleUpload = async (file, campaignId, contentType) => {
    const analysisId = await uploadVideo(file);
    if (analysisId) {
      // After upload completes, navigate to the analysis
      navigate(`/analysis/${analysisId}`);
    }
  };

  // Cross-video insights
  const insights = computeInsights(videos);

  return (
    <div className="mt-6">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: `Campaign` },
      ]} />

      {/* Campaign header */}
      <div className="flex items-center justify-between mt-6 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-bright">Campaign</h1>
          <p className="text-sm text-text-dim mt-1">{videos.length} video{videos.length !== 1 ? 's' : ''} analyzed</p>
        </div>
        <Button variant="secondary" onClick={() => setShowUpload(!showUpload)}>
          <Plus size={14} />
          Add Videos
        </Button>
      </div>

      {/* Batch upload (expandable) */}
      {showUpload && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6"
        >
          <BatchUpload onUpload={handleUpload} campaignId={id} />
        </motion.div>
      )}

      {/* Cross-video insights */}
      {insights.length > 0 && (
        <Card className="mb-6">
          <h3 className="font-display text-sm font-semibold text-text-bright mb-3">Cross-Video Insights</h3>
          <div className="flex flex-col gap-2">
            {insights.map((insight, i) => (
              <p key={i} className="text-sm text-text-main font-body">
                {insight}
              </p>
            ))}
          </div>
        </Card>
      )}

      {/* Video grid */}
      {videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video, i) => (
            <motion.div
              key={video.analysisId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <VideoCard video={video} onClick={() => handleSelect(video.analysisId)} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-text-ghost">
          <p className="font-display text-lg mb-4">No videos yet</p>
          <Button variant="primary" onClick={() => setShowUpload(true)}>
            <Plus size={14} />
            Upload your first video
          </Button>
        </div>
      )}
    </div>
  );
}

function VideoCard({ video, onClick }) {
  const score = video.neuralScore;
  const color = score ? getScoreColor(score) : '#3A4A63';

  return (
    <button
      onClick={onClick}
      className="w-full text-left group rounded-[var(--radius-lg)] border border-border
        bg-depth-1/50 overflow-hidden hover:border-border-active transition-all"
    >
      {/* Thumbnail placeholder */}
      <div className="h-[120px] bg-depth-2 flex items-center justify-center relative">
        <span className="font-mono text-text-ghost text-xs truncate px-3">{video.filename}</span>
        {score && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-[var(--radius-full)]
            bg-void/70 backdrop-blur-sm border border-border">
            <span className="font-display text-sm font-bold" style={{ color }}>{score}</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm text-text-main font-body truncate group-hover:text-text-bright transition-colors">
          {video.filename}
        </p>
        {video.completedAt && (
          <p className="text-[10px] text-text-ghost font-mono mt-1">
            {new Date(video.completedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </button>
  );
}

function computeInsights(videos) {
  if (videos.length < 2) return [];

  const insights = [];
  const scores = videos.filter(v => v.neuralScore).map(v => v.neuralScore);
  if (scores.length < 2) return [];

  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const best = Math.max(...scores);
  const worst = Math.min(...scores);

  insights.push(`Average neural score across ${scores.length} videos: ${avg}/100`);

  if (best - worst > 20) {
    insights.push(`Score range is ${best - worst} points — significant variation in content quality`);
  }

  if (avg >= 70) {
    insights.push('Strong overall performance — most videos are engaging');
  } else if (avg < 45) {
    insights.push('Below average scores — consider reviewing editing patterns');
  }

  return insights;
}
