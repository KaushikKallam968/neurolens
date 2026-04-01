import { useState, useRef, useCallback, useEffect } from 'react';

const POLL_INTERVAL = 2000;
const GPU_URL_KEY = 'neurolens_gpu_url';

export function useAnalysis() {
  const [status, setStatus] = useState('idle');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [analyses, setAnalyses] = useState([]);
  const [gpuUrl, setGpuUrlState] = useState(() => {
    try {
      return localStorage.getItem(GPU_URL_KEY) || null;
    } catch (err) {
      return null;
    }
  });
  const pollingRef = useRef(null);

  const setGpuUrl = useCallback((url) => {
    setGpuUrlState(url);
    try {
      if (url) {
        localStorage.setItem(GPU_URL_KEY, url);
      } else {
        localStorage.removeItem(GPU_URL_KEY);
      }
    } catch (err) {
      // localStorage unavailable — state still works in-memory
    }
  }, []);

  const getApiUrl = useCallback((path) => {
    if (gpuUrl) return `${gpuUrl}${path}`;
    return path;
  }, [gpuUrl]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const fetchAnalyses = useCallback(async () => {
    try {
      const response = await fetch(getApiUrl('/api/analyses'));
      if (!response.ok) return;
      const data = await response.json();
      setAnalyses(data);
    } catch (err) {
      // Silent fail — history is non-critical
    }
  }, [getApiUrl]);

  // Fetch analyses on mount and when gpuUrl changes
  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  const pollResults = useCallback((analysisId) => {
    let attempts = 0;
    pollingRef.current = setInterval(async () => {
      try {
        attempts++;
        setProgress(Math.min(95, attempts * 8));
        const response = await fetch(getApiUrl(`/api/results/${analysisId}`));
        if (!response.ok) throw new Error('Failed to fetch results');

        const data = await response.json();
        if (data.status === 'complete') {
          stopPolling();
          setProgress(100);
          setResults(data);
          setStatus('complete');
          fetchAnalyses();
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
  }, [stopPolling, fetchAnalyses, getApiUrl]);

  const uploadVideo = useCallback(async (file) => {
    try {
      setStatus('uploading');
      setError(null);
      setProgress(0);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(getApiUrl('/api/analyze'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();

      if (data.instant && data.status === 'complete') {
        // Vercel serverless — results came back immediately
        setResults(data);
        setStatus('complete');
        setProgress(100);
        fetchAnalyses();
        return data.analysisId;
      }

      // Local backend — poll for async results
      setStatus('processing');
      pollResults(data.analysisId);
      return data.analysisId;
    } catch (err) {
      setError(err.message);
      setStatus('error');
      return null;
    }
  }, [pollResults, getApiUrl]);

  const selectAnalysis = useCallback(async (analysisId) => {
    try {
      const response = await fetch(getApiUrl(`/api/results/${analysisId}`));
      if (!response.ok) throw new Error('Failed to load analysis');
      const data = await response.json();
      setResults(data);
      setStatus('complete');
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [getApiUrl]);

  const reset = useCallback(() => {
    stopPolling();
    setStatus('idle');
    setResults(null);
    setError(null);
    setProgress(0);
  }, [stopPolling]);

  return {
    status,
    results,
    error,
    progress,
    analyses,
    gpuUrl,
    setGpuUrl,
    getApiUrl,
    uploadVideo,
    selectAnalysis,
    fetchAnalyses,
    reset,
  };
}
