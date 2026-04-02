import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAnalysisContext } from '../contexts/AnalysisContext';
import { useVideoSync } from '../hooks/useVideoSync';
import ProcessingOverlay from '../components/ProcessingOverlay';
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
import { Breadcrumb } from '../components/ui';

export default function AnalysisPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { results, status, progress, stage, selectAnalysis, getApiUrl } = useAnalysisContext();
  const videoRef = useRef(null);
  const dashboardRef = useRef(null);
  const { currentTime, seekAndPlay } = useVideoSync(videoRef);
  const [phase, setPhase] = useState('loading');

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
      // If we arrived from upload, show reveal. If from history, skip to dashboard.
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

  return (
    <div className="mt-4">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: results?.filename || 'Analysis' },
      ]} />

      <AnimatePresence mode="wait">
        {phase === 'processing' && (
          <ProcessingOverlay key="processing" progress={progress} stage={stage} />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {phase === 'reveal' && results && (
          <NeuralScore
            key="reveal"
            score={results?.data?.neuralScore || 0}
            verdict={results?.data?.verdict}
            fullscreen={true}
            onComplete={handleRevealComplete}
          />
        )}
      </AnimatePresence>

      {(phase === 'dashboard' || phase === 'reveal') && results && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'dashboard' ? 1 : 0 }}
          className="mt-4 relative"
        >
          <div ref={dashboardRef}>
            <Dashboard
              results={results}
              videoRef={videoRef}
              onSeek={handleSeek}
              currentTime={currentTime}
              getApiUrl={getApiUrl}
            />
          </div>
          <Onboarding />
        </motion.div>
      )}
    </div>
  );
}

function Dashboard({ results, videoRef, onSeek, currentTime, getApiUrl }) {
  const data = results?.data || {};
  const {
    neuralScore, percentile, metrics, timeline,
    sensoryTimeline, cognitiveLoad, focusScore,
    narrativeArc, avSyncScore, keyMoments, suggestions,
  } = data;

  const analysisId = results?.analysisId || null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-4 mt-4"
    >
      {/* Tier 1: Score summary bar */}
      <ScoreSummaryBar
        neuralScore={neuralScore}
        percentile={percentile}
        cognitiveLoad={cognitiveLoad}
        focusScore={focusScore}
        avSyncScore={avSyncScore}
      />

      {/* Tier 2: Video + Brain + Sensory + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <VideoPlayer
            videoRef={videoRef}
            analysisId={analysisId}
            getApiUrl={getApiUrl}
          />
        </div>
        <div className="lg:col-span-3">
          <BrainViewer
            metrics={metrics}
            timeline={timeline}
            currentTime={currentTime}
          />
        </div>
      </div>

      <SensoryBreakdown
        sensoryTimeline={sensoryTimeline}
        currentTime={currentTime}
      />

      <Timeline data={timeline} currentTime={currentTime} />

      {/* Tier 3: Metrics + Insights + Key Moments + Narrative */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col gap-4">
          <MetricsPanel metrics={metrics} timeline={timeline} />
          <NarrativeArc narrativeArc={narrativeArc} />
        </div>
        <div className="flex flex-col gap-4">
          <KeyMoments keyMoments={keyMoments} onSeek={onSeek} />
          <EditingSuggestions suggestions={suggestions} onSeek={onSeek} />
        </div>
      </div>
    </motion.div>
  );
}

function VideoPlayer({ videoRef, analysisId, getApiUrl }) {
  const videoUrl = analysisId ? getApiUrl(`/api/video/${analysisId}`) : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-border bg-depth-1/50 overflow-hidden flex items-center justify-center min-h-[320px]"
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
