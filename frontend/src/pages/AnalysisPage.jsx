import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, Flame, Share2 } from 'lucide-react';
import { useAnalysisContext } from '../contexts/AnalysisContext';
import { useVideoSync } from '../hooks/useVideoSync';
import InlineProgress from '../components/InlineProgress';
import NeuralScore from '../components/NeuralScore';
import MetricsPanel from '../components/MetricsPanel';
import Timeline from '../components/Timeline';
import BrainViewer from '../components/BrainViewer';
import EditingSuggestions from '../components/EditingSuggestions';
import ScoreSummaryBar from '../components/ScoreSummaryBar';
import SensoryBreakdown from '../components/SensoryBreakdown';
import NarrativeArc from '../components/NarrativeArc';
import KeyMoments from '../components/KeyMoments';
import Onboarding from '../components/Onboarding';
import HeatStrip from '../components/HeatStrip';
import Verdict from '../components/Verdict';
import RetentionCurve from '../components/RetentionCurve';
import ValenceArousal from '../components/ValenceArousal';
import AttentionHeatmap from '../components/AttentionHeatmap';
import KeyMomentThumbnails from '../components/KeyMomentThumbnails';
import AICopilot from '../components/AICopilot';
import ShareDialog from '../components/ShareDialog';
import { Breadcrumb, Button } from '../components/ui';

export default function AnalysisPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { results, status, progress, stage, selectAnalysis, getApiUrl } = useAnalysisContext();
  const videoRef = useRef(null);
  const dashboardRef = useRef(null);
  const { currentTime, seekAndPlay } = useVideoSync(videoRef);
  const [phase, setPhase] = useState('loading');
  const [heatmapMode, setHeatmapMode] = useState('off'); // off | heatmap | fog
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // Load analysis by ID if navigated directly
  useEffect(() => {
    if (id && (!results || results.analysisId !== id)) {
      selectAnalysis(id);
    }
  }, [id, results, selectAnalysis]);

  // Phase transitions
  useEffect(() => {
    if (status === 'uploading' || status === 'processing') {
      setPhase('processing');
    } else if (status === 'complete' && results) {
      if (phase === 'processing') {
        setPhase('reveal');
      } else if (phase === 'loading') {
        setPhase('dashboard');
      }
    } else if (status === 'error') {
      setPhase('error');
    }
  }, [status, results]);

  const handleRevealComplete = useCallback(() => {
    setPhase('dashboard');
  }, []);

  const handleSeek = useCallback((timestamp) => {
    seekAndPlay(timestamp);
  }, [seekAndPlay]);

  const toggleHeatmap = useCallback(() => {
    if (heatmapMode === 'off') setHeatmapMode('heatmap');
    else if (heatmapMode === 'heatmap') setHeatmapMode('fog');
    else setHeatmapMode('off');
    setShowHeatmap(heatmapMode !== 'fog'); // will be true after state update
  }, [heatmapMode]);

  if (!results && phase !== 'processing') {
    return (
      <div className="mt-6">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Analysis' },
        ]} />
        <div className="mt-12 flex items-center justify-center text-text-ghost">
          <p className="font-display text-lg">Loading analysis...</p>
        </div>
      </div>
    );
  }

  const data = results?.data || {};

  return (
    <div className="mt-4">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: results?.filename || 'Analysis' },
      ]} />

      {/* Inline processing (replaces fullscreen overlay) */}
      {phase === 'processing' && (
        <InlineProgress progress={progress} stage={stage} />
      )}

      {/* Score reveal animation */}
      <AnimatePresence mode="wait">
        {phase === 'reveal' && results && (
          <NeuralScore
            key="reveal"
            score={data.neuralScore || 0}
            verdict={data.verdict}
            fullscreen={true}
            onComplete={handleRevealComplete}
          />
        )}
      </AnimatePresence>

      {/* Three-tier dashboard */}
      {phase === 'dashboard' && results && (
        <motion.div
          ref={dashboardRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-4 mt-4"
        >
          {/* ===== TIER 1: Glance ===== */}
          <section aria-label="Score overview">
            <ScoreSummaryBar
              neuralScore={data.neuralScore}
              percentile={data.percentile}
              cognitiveLoad={data.cognitiveLoad}
              focusScore={data.focusScore}
              avSyncScore={data.avSyncScore}
            />
            <div className="flex items-center gap-4 mt-3">
              <Verdict
                neuralScore={data.neuralScore}
                timeline={data.timeline}
                keyMoments={data.keyMoments}
                className="flex-1"
              />
            </div>
            <HeatStrip
              timeline={data.timeline}
              currentTime={currentTime}
              onClick={handleSeek}
              className="mt-3"
            />
          </section>

          {/* ===== TIER 2: Explore ===== */}
          <section aria-label="Video analysis" className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 relative">
              <VideoPlayer
                videoRef={videoRef}
                analysisId={results?.analysisId}
                getApiUrl={getApiUrl}
              />
              <AttentionHeatmap
                videoRef={videoRef}
                attentionData={data.timeline?.attentionFocus}
                currentTime={currentTime}
                mode={heatmapMode === 'off' ? 'heatmap' : heatmapMode}
                visible={heatmapMode !== 'off'}
              />
              {/* Heatmap toggle */}
              <button
                onClick={toggleHeatmap}
                className="absolute bottom-3 right-3 z-10 px-2 py-1.5 rounded-[var(--radius-sm)]
                  bg-void/70 backdrop-blur-sm border border-border text-text-dim text-xs
                  hover:text-text-main hover:border-border-active transition-all flex items-center gap-1.5"
                aria-label={`Attention overlay: ${heatmapMode}`}
              >
                {heatmapMode === 'off' ? <Eye size={12} /> : heatmapMode === 'heatmap' ? <Flame size={12} /> : <EyeOff size={12} />}
                {heatmapMode === 'off' ? 'Heatmap' : heatmapMode === 'heatmap' ? 'Fog' : 'Off'}
              </button>
            </div>
            <div className="lg:col-span-3">
              <BrainViewer
                metrics={data.metrics}
                timeline={data.timeline}
                currentTime={currentTime}
              />
            </div>
          </section>

          <SensoryBreakdown
            sensoryTimeline={data.sensoryTimeline}
            currentTime={currentTime}
          />

          <Timeline data={data.timeline} currentTime={currentTime} />

          {/* Key Moment Thumbnails strip */}
          <KeyMomentThumbnails keyMoments={data.keyMoments} onSeek={handleSeek} />

          {/* ===== TIER 3: Deep Dive ===== */}
          <section aria-label="Detailed analysis" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col gap-4">
              <MetricsPanel metrics={data.metrics} timeline={data.timeline} />
              <RetentionCurve timeline={data.timeline} onSeek={handleSeek} />
              <NarrativeArc narrativeArc={data.narrativeArc} />
            </div>
            <div className="flex flex-col gap-4">
              <ValenceArousal timeline={data.timeline} currentTime={currentTime} />
              <KeyMoments keyMoments={data.keyMoments} onSeek={handleSeek} />
              <EditingSuggestions suggestions={data.suggestions} onSeek={handleSeek} />
            </div>
          </section>

          {/* AI Copilot */}
          <AICopilot data={data} analysisId={results?.analysisId} />

          {/* Share button */}
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowShare(true)}>
              <Share2 size={14} />
              Share
            </Button>
          </div>

          <Onboarding />
        </motion.div>
      )}

      {/* Share dialog */}
      <ShareDialog
        open={showShare}
        onClose={() => setShowShare(false)}
        analysisId={results?.analysisId}
        neuralScore={data?.neuralScore}
      />
    </div>
  );
}

function VideoPlayer({ videoRef, analysisId, getApiUrl }) {
  const videoUrl = analysisId ? getApiUrl(`/api/video/${analysisId}`) : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-border bg-depth-1/50 overflow-hidden flex items-center justify-center min-h-[320px] relative"
    >
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          preload="auto"
          playsInline
          className="w-full h-full object-contain max-h-[400px] bg-void"
          style={{ minHeight: '200px' }}
        />
      ) : (
        <div className="flex flex-col items-center gap-3 text-text-ghost">
          <div className="w-16 h-16 rounded-full bg-primary-dim flex items-center justify-center">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-body">No video available</p>
        </div>
      )}
    </motion.div>
  );
}
