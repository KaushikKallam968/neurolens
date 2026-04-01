import { useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { useAnalysis } from './hooks/useAnalysis';
import Upload from './components/Upload';
import ProcessingOverlay from './components/ProcessingOverlay';
import NeuralScore from './components/NeuralScore';
import MetricsPanel from './components/MetricsPanel';
import Timeline from './components/Timeline';
import BrainViewer from './components/BrainViewer';
import EditingSuggestions from './components/EditingSuggestions';

export default function App() {
  const { status, results, progress, uploadVideo, reset, error } = useAnalysis();
  const videoRef = useRef(null);

  const handleSeek = useCallback((timestamp) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      videoRef.current.play();
    }
  }, []);

  const isIdle = status === 'idle';
  const isProcessing = status === 'uploading' || status === 'processing';
  const isComplete = status === 'complete' && results;

  return (
    <div className="min-h-screen bg-background">
      <Header onReset={isComplete ? reset : null} />

      <AnimatePresence mode="wait">
        {isProcessing && (
          <ProcessingOverlay key="processing" progress={progress} />
        )}
      </AnimatePresence>

      <main className="max-w-[1440px] mx-auto px-5 pb-12">
        <AnimatePresence mode="wait">
          {error && <ErrorBanner key="error" message={error} onRetry={reset} />}

          {isIdle && <Upload key="upload" onUpload={uploadVideo} />}

          {isComplete && (
            <Dashboard
              key="dashboard"
              results={results}
              videoRef={videoRef}
              onSeek={handleSeek}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Header({ onReset }) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-card-border/50">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-nl-cyan shadow-[0_0_8px_rgba(0,212,255,0.5)]" />
        <span className="text-lg font-semibold tracking-tight">
          <span className="text-text-primary">Neuro</span>
          <span className="text-nl-cyan">Lens</span>
        </span>
      </div>
      {onReset && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-card-border text-text-secondary text-sm hover:border-nl-cyan/30 hover:text-nl-cyan transition-all"
        >
          <RotateCcw size={14} />
          New Analysis
        </motion.button>
      )}
    </header>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mt-6 p-4 rounded-xl border border-nl-coral/30 bg-nl-coral/5 flex items-center justify-between"
    >
      <p className="text-sm text-nl-coral">{message}</p>
      <button
        onClick={onRetry}
        className="text-sm text-nl-coral font-medium hover:underline"
      >
        Try Again
      </button>
    </motion.div>
  );
}

function Dashboard({ results, videoRef, onSeek }) {
  const data = results?.data || {};
  const { neuralScore, metrics, timeline, peaks, suggestions } = data;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="mt-6 flex flex-col gap-5"
    >
      {/* Top row: Video | Brain | Score + Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <VideoPlayer videoRef={videoRef} />
        <BrainViewer metrics={metrics} />
        <div className="flex flex-col gap-5">
          <NeuralScore score={neuralScore || 0} />
          <MetricsPanel metrics={metrics} timeline={timeline} />
        </div>
      </div>

      {/* Timeline */}
      <Timeline data={timeline} />

      {/* Editing Suggestions */}
      <EditingSuggestions suggestions={suggestions} onSeek={onSeek} />
    </motion.div>
  );
}

function VideoPlayer({ videoRef }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-card-border bg-card/30 overflow-hidden flex items-center justify-center min-h-[320px]"
    >
      <div className="flex flex-col items-center gap-3 text-text-muted">
        <div className="w-16 h-16 rounded-full bg-nl-cyan/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-nl-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm">Analysis Complete</p>
        <p className="text-xs text-text-muted/60">Upload another video to see it here</p>
      </div>
    </motion.div>
  );
}
