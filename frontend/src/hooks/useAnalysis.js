import { useState, useRef, useCallback } from 'react';

const POLL_INTERVAL = 2000;

export function useAnalysis() {
  const [status, setStatus] = useState('idle');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
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
        setProgress(Math.min(95, attempts * 8));
        const response = await fetch(`/api/results/${analysisId}`);
        if (!response.ok) throw new Error('Failed to fetch results');

        const data = await response.json();
        if (data.status === 'complete') {
          stopPolling();
          setProgress(100);
          setResults(data);
          setStatus('complete');
        } else if (data.status === 'error') {
          stopPolling();
          setError(data.message || 'Analysis failed');
          setStatus('error');
        }
      } catch (err) {
        stopPolling();
        setError(err.message);
        setStatus('error');
      }
    }, POLL_INTERVAL);
  }, [stopPolling]);

  const uploadVideo = useCallback(async (file) => {
    try {
      setStatus('uploading');
      setError(null);
      setProgress(0);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setStatus('processing');
      pollResults(data.analysisId);
      return data.analysisId;
    } catch (err) {
      setError(err.message);
      setStatus('error');
      return null;
    }
  }, [pollResults]);

  const reset = useCallback(() => {
    stopPolling();
    setStatus('idle');
    setResults(null);
    setError(null);
    setProgress(0);
  }, [stopPolling]);

  return { status, results, error, progress, uploadVideo, reset };
}
