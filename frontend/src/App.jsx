import { useState, useRef, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw, GitCompare } from 'lucide-react';
import { useAnalysis } from './hooks/useAnalysis';
import Upload from './components/Upload';
import GpuSettings from './components/GpuSettings';
import ProcessingOverlay from './components/ProcessingOverlay';
import NeuralScore from './components/NeuralScore';
import MetricsPanel from './components/MetricsPanel';
import Timeline from './components/Timeline';
import BrainViewer from './components/BrainViewer';
import EditingSuggestions from './components/EditingSuggestions';
import AnalysisHistory from './components/AnalysisHistory';
import ScoreSummaryBar from './components/ScoreSummaryBar';
import SensoryBreakdown from './components/SensoryBreakdown';
import NarrativeArc from './components/NarrativeArc';
import KeyMoments from './components/KeyMoments';
import CompareView from './components/CompareView';
import ExportButton from './components/ExportButton';
import Onboarding from './components/Onboarding';

export default function App() {
  const {
    status, results, progress, uploadVideo, reset, error,
    analyses, selectAnalysis, gpuUrl, gpuSource, setGpuUrl, getApiUrl,
  } = useAnalysis();
  const videoRef = useRef(null);
  const dashboardRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [phase, setPhase] = useState('idle');
  const [compareMode, setCompareMode] = useState(false);
  const [compareData, setCompareData] = useState({ a: null, b: null });

  const handleSeek = useCallback((timestamp) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      videoRef.current.play();
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  useEffect(() => {
    if (status === 'idle') {
      setPhase('idle');
    } else if (status === 'uploading' || status === 'processing') {
      setPhase('processing');
    } else if (status === 'complete' && results) {
      setPhase('reveal');
    } else if (status === 'error') {
      setPhase('idle');
    }
  }, [status, results]);

  const handleRevealComplete = useCallback(() => {
    setPhase('dashboard');
  }, []);

  const handleReset = useCallback(() => {
    reset();
    setPhase('idle');
  }, [reset]);

  const handleSelectAnalysis = useCallback((analysisId) => {
    selectAnalysis(analysisId);
    setPhase('dashboard');
  }, [selectAnalysis]);

  const handleCompare = useCallback(async () => {
    if (analyses.length < 2) return;
    try {
      const [first, second] = analyses.slice(0, 2);
      const [resA, resB] = await Promise.all([
        fetch(getApiUrl(`/api/results/${first.analysisId}`)).then((r) => r.json()),
        fetch(getApiUrl(`/api/results/${second.analysisId}`)).then((r) => r.json()),
      ]);
      setCompareData({ a: resA, b: resB });
      setCompareMode(true);
    } catch (err) {
      console.error('Compare fetch failed:', err);
    }
  }, [analyses, getApiUrl]);

  const activeAnalysisId = results?.analysisId || null;
  const fileName = results?.fileName || null;

  return (
    <div className="min-h-screen bg-void">
      <Header
        onReset={phase === 'dashboard' ? handleReset : null}
        fileName={phase === 'dashboard' ? fileName : null}
        canCompare={phase === 'dashboard' && analyses.length >= 2}
        onCompare={handleCompare}
        showExport={phase === 'dashboard' && !!results}
        dashboardRef={dashboardRef}
        score={results?.data?.neuralScore}
        gpuUrl={gpuUrl}
        setGpuUrl={setGpuUrl}
      />

      <AnimatePresence mode="wait">
        {phase === 'processing' && (
          <ProcessingOverlay key="processing" progress={progress} />
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

      <AnimatePresence>
        {compareMode && compareData.a && compareData.b && (
          <CompareView
            key="compare"
            analysisA={compareData.a}
            analysisB={compareData.b}
            onClose={() => setCompareMode(false)}
          />
        )}
      </AnimatePresence>

      <main className="max-w-[1440px] mx-auto px-5 pb-12">
        <AnimatePresence mode="wait">
          {error && <ErrorBanner key="error" message={error} onRetry={handleReset} />}

          {phase === 'idle' && <Upload key="upload" onUpload={uploadVideo} />}

          {phase === 'dashboard' && results && (
            <motion.div
              key="dashboard-wrapper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 relative"
            >
              <AnalysisHistory
                analyses={analyses}
                activeId={activeAnalysisId}
                onSelect={handleSelectAnalysis}
                onNewAnalysis={handleReset}
              />
              <div ref={dashboardRef}>
                <Dashboard
                  results={results}
                  videoRef={videoRef}
                  onSeek={handleSeek}
                  onTimeUpdate={handleTimeUpdate}
                  currentTime={currentTime}
                  analysisId={activeAnalysisId}
                  getApiUrl={getApiUrl}
                />
              </div>
              <Onboarding />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Header({ onReset, fileName, canCompare, onCompare, showExport, dashboardRef, score, gpuUrl, setGpuUrl }) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-[pulse-ring_3s_ease-in-out_infinite]" style={{ boxShadow: '0 0 8px rgba(108, 159, 255, 0.5)' }} />
        <span className="font-display text-lg font-bold" style={{ letterSpacing: '-0.03em' }}>
          <span className="text-text-bright">Neuro</span>
          <span className="text-primary">Lens</span>
        </span>
      </div>

      {fileName && (
        <span className="font-mono text-xs text-text-dim truncate max-w-[300px]">
          {fileName}
        </span>
      )}

      <div className="flex items-center gap-3">
        <GpuSettings gpuUrl={gpuUrl} gpuSource={gpuSource} setGpuUrl={setGpuUrl} />
        {canCompare && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onCompare}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-text-dim text-xs font-mono hover:border-border-active hover:text-text-main transition-all"
          >
            <GitCompare size={13} />
            Compare
          </motion.button>
        )}
        {showExport && (
          <ExportButton targetRef={dashboardRef} score={score} />
        )}
        {onReset && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-text-dim text-sm hover:border-border-active hover:text-primary transition-all font-body"
          >
            <RotateCcw size={14} />
            New Analysis
          </motion.button>
        )}
      </div>
    </header>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mt-6 p-4 rounded-xl border border-score-low/30 bg-score-low/5 flex items-center justify-between"
    >
      <p className="text-sm text-score-low">{message}</p>
      <button
        onClick={onRetry}
        className="text-sm text-score-low font-medium hover:underline"
      >
        Try Again
      </button>
    </motion.div>
  );
}

function Dashboard({ results, videoRef, onSeek, onTimeUpdate, currentTime, analysisId, getApiUrl }) {
  const data = results?.data || {};
  const {
    neuralScore, percentile, metrics, timeline,
    sensoryTimeline, cognitiveLoad, focusScore,
    narrativeArc, avSyncScore, keyMoments, suggestions,
  } = data;

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
            onTimeUpdate={onTimeUpdate}
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

function VideoPlayer({ videoRef, analysisId, onTimeUpdate, getApiUrl }) {
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
          onTimeUpdate={onTimeUpdate}
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
