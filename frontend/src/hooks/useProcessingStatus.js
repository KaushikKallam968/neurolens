import { useState, useRef, useCallback } from 'react';

const POLL_INTERVAL = 2000;

// Map backend stage names to progress percentages and labels
const STAGE_PROGRESS = {
  extracting_events: { progress: 10, label: 'Extracting audio & video events' },
  events_extracted: { progress: 25, label: 'Events extracted' },
  extracting_features: { progress: 30, label: 'Extracting visual & audio features' },
  predicting: { progress: 65, label: 'Predicting neural activation' },
  computing_metrics: { progress: 90, label: 'Computing engagement metrics' },
  complete: { progress: 100, label: 'Analysis complete' },
};

// State machine: idle -> uploading -> processing -> complete | error
export function useProcessingStatus({ getApiUrl, onComplete, onPartialResults }) {
  const [status, setStatus] = useState('idle'); // idle | uploading | processing | complete | error
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(null);
  const [error, setError] = useState(null);
  const pollingRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const pollResults = useCallback((analysisId) => {
    let attempts = 0;
    pollingRef.current = setInterval(async () => {
      try {
        attempts++;
        const response = await fetch(getApiUrl(`/api/results/${analysisId}`));
        if (!response.ok) throw new Error('Failed to fetch results');

        const data = await response.json();

        // Update stage and progress from backend
        if (data.stage && STAGE_PROGRESS[data.stage]) {
          const stageInfo = STAGE_PROGRESS[data.stage];
          setStage(data.stage);
          setProgress(stageInfo.progress);
        } else {
          const elapsed = attempts * (POLL_INTERVAL / 1000);
          setProgress(Math.min(95, Math.round(95 * (1 - Math.exp(-elapsed / 120)))));
        }

        // Progressive data: show partial results while still processing
        if (data.status === 'processing' && data.data) {
          onPartialResults?.(data);
        }

        if (data.status === 'complete') {
          stopPolling();
          setProgress(100);
          setStage('complete');
          setStatus('complete');
          onComplete?.(data);
        } else if (data.status === 'error') {
          stopPolling();
          setError(data.error || data.message || 'Analysis failed');
          setStatus('error');
        }
      } catch (err) {
        stopPolling();
        setError(err.message);
        setStatus('error');
      }
    }, POLL_INTERVAL);
  }, [stopPolling, getApiUrl, onComplete, onPartialResults]);

  const startUploading = useCallback(() => {
    setStatus('uploading');
    setError(null);
    setProgress(0);
    setStage(null);
  }, []);

  const startProcessing = useCallback((analysisId) => {
    setStatus('processing');
    pollResults(analysisId);
  }, [pollResults]);

  const completeInstant = useCallback(() => {
    setStatus('complete');
    setProgress(100);
  }, []);

  const setErrorState = useCallback((message) => {
    setError(message);
    setStatus('error');
  }, []);

  const reset = useCallback(() => {
    stopPolling();
    setStatus('idle');
    setProgress(0);
    setStage(null);
    setError(null);
  }, [stopPolling]);

  return {
    status,
    progress,
    stage,
    error,
    stageLabel: stage ? STAGE_PROGRESS[stage]?.label : null,
    startUploading,
    startProcessing,
    completeInstant,
    setErrorState,
    reset,
  };
}
