import { useState, useRef, useCallback, useEffect } from 'react';
import { getGpuUrl, saveAnalysis, listAnalyses as sbListAnalyses, getAnalysis as sbGetAnalysis, uploadVideo as sbUploadVideo, getVideoUrl } from '../lib/supabase';

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
  const [gpuSource, setGpuSource] = useState(null); // 'supabase' | 'manual' | null
  const pollingRef = useRef(null);

  const setGpuUrl = useCallback((url, source = 'manual') => {
    setGpuUrlState(url);
    setGpuSource(url ? source : null);
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

  // Auto-discover GPU URL from Supabase, then verify it
  useEffect(() => {
    const controller = new AbortController();

    async function autoDiscover() {
      try {
        const discoveredUrl = await getGpuUrl();
        if (!discoveredUrl) {
          setGpuUrl(null);
          return;
        }

        // Verify the GPU is actually reachable
        const health = await fetch(`${discoveredUrl}/api/health`, {
          signal: controller.signal, mode: 'cors',
        }).then(r => r.ok ? r.json() : null).catch(() => null);

        if (health?.status === 'ok') {
          setGpuUrl(discoveredUrl, 'supabase');
        } else {
          setGpuUrl(null);
        }
      } catch {
        // Discovery failed silently
      }
    }

    autoDiscover();
    // Also fetch analysis history from Supabase
    fetchAnalyses();

    return () => controller.abort();
  }, []); // Only on mount

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const fetchAnalyses = useCallback(async () => {
    try {
      // Try Supabase first (persistent, cross-device)
      const sbData = await sbListAnalyses();
      if (sbData.length > 0) {
        setAnalyses(sbData.map(a => ({
          analysisId: a.analysis_id,
          filename: a.filename,
          neuralScore: a.neural_score,
          createdAt: a.created_at,
          completedAt: a.completed_at,
        })));
        return;
      }
      // Fall back to local API
      const response = await fetch(getApiUrl('/api/analyses'));
      if (!response.ok) return;
      const data = await response.json();
      setAnalyses(data);
    } catch {
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
          // Persist to Supabase
          if (data.data) {
            saveAnalysis(
              data.analysisId,
              data.filename,
              data.data.neuralScore,
              data.data.percentile,
              data.data
            );
          }
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
        // Persist to Supabase
        if (data.data) {
          saveAnalysis(
            data.analysisId,
            data.filename,
            data.data.neuralScore,
            data.data.percentile,
            data.data
          );
        }
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
      // Try Supabase first (persistent, cross-device)
      const sbData = await sbGetAnalysis(analysisId);
      if (sbData?.data) {
        setResults({
          analysisId: sbData.analysis_id,
          filename: sbData.filename,
          status: sbData.status,
          data: sbData.data,
        });
        setStatus('complete');
        setError(null);
        return;
      }
      // Fall back to local API
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
    gpuSource,
    setGpuUrl,
    getApiUrl,
    uploadVideo,
    selectAnalysis,
    fetchAnalyses,
    reset,
  };
}
