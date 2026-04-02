import { useCallback, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw, GitCompare } from 'lucide-react';
import { AnalysisProvider, useAnalysisContext } from './contexts/AnalysisContext';
import GpuSettings from './components/GpuSettings';
import CompareView from './components/CompareView';
import ExportButton from './components/ExportButton';

export default function App() {
  return (
    <AnalysisProvider>
      <AppShell />
    </AnalysisProvider>
  );
}

function AppShell() {
  const { results, analyses, reset, getApiUrl, status } = useAnalysisContext();
  const navigate = useNavigate();
  const [compareMode, setCompareMode] = useState(false);
  const [compareData, setCompareData] = useState({ a: null, b: null });

  const handleReset = useCallback(() => {
    reset();
    navigate('/');
  }, [reset, navigate]);

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

  const isDashboard = status === 'complete' && !!results;

  return (
    <div className="min-h-screen bg-void">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Header
        onReset={isDashboard ? handleReset : null}
        fileName={isDashboard ? results?.filename : null}
        canCompare={isDashboard && analyses.length >= 2}
        onCompare={handleCompare}
        showExport={isDashboard}
        score={results?.data?.neuralScore}
      />

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

      <main id="main-content" className="max-w-[1440px] mx-auto px-5 pb-12">
        <Outlet />
      </main>
    </div>
  );
}

function Header({ onReset, fileName, canCompare, onCompare, showExport, score }) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-[pulse-ring_3s_ease-in-out_infinite]" style={{ boxShadow: '0 0 8px rgba(108, 159, 255, 0.5)' }} />
        <a href="/" className="font-display text-lg font-bold" style={{ letterSpacing: '-0.03em' }}>
          <span className="text-text-bright">Neuro</span>
          <span className="text-primary">Lens</span>
        </a>
      </div>

      {fileName && (
        <span className="font-mono text-xs text-text-dim truncate max-w-[300px]">
          {fileName}
        </span>
      )}

      <div className="flex items-center gap-3">
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
