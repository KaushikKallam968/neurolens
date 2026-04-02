import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useProcessingStatus } from '../hooks/useProcessingStatus';
import { useCampaigns } from '../hooks/useCampaigns';
import { uploadVideo as sbUploadVideo } from '../lib/supabase';
import { DEMO_ANALYSIS } from '../lib/demoData';

const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
  const [results, setResults] = useState(null);
  const videoRef = useRef(null);

  // API URL — for v2 this will become Vercel Edge, for now keep backward compat
  const getApiUrl = useCallback((path) => path, []);

  const campaigns = useCampaigns({ getApiUrl });

  const processing = useProcessingStatus({
    getApiUrl,
    onComplete: (data) => {
      setResults(data);
      campaigns.persistAnalysis(data);
    },
    onPartialResults: (data) => {
      setResults(data);
    },
  });

  const uploadVideo = useCallback(async (file) => {
    try {
      processing.startUploading();

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
        processing.completeInstant();
        campaigns.persistAnalysis(data);
        return data.analysisId;
      }

      // Local backend — poll for async results
      processing.startProcessing(data.analysisId);
      return data.analysisId;
    } catch (err) {
      processing.setErrorState(err.message);
      return null;
    }
  }, [getApiUrl, processing, campaigns]);

  const selectAnalysis = useCallback(async (analysisId) => {
    // Handle demo analysis without API call
    if (analysisId === 'demo-analysis') {
      setResults(DEMO_ANALYSIS);
      processing.completeInstant();
      return;
    }
    try {
      const data = await campaigns.loadAnalysis(analysisId);
      setResults(data);
      processing.completeInstant();
    } catch (err) {
      processing.setErrorState(err.message);
    }
  }, [campaigns, processing]);

  const reset = useCallback(() => {
    processing.reset();
    setResults(null);
  }, [processing]);

  const value = {
    // Results
    results,
    // Processing status
    status: processing.status,
    progress: processing.progress,
    stage: processing.stage,
    stageLabel: processing.stageLabel,
    error: processing.error,
    // Campaigns / history
    analyses: campaigns.analyses,
    // Video ref (shared across components)
    videoRef,
    // Actions
    uploadVideo,
    selectAnalysis,
    reset,
    getApiUrl,
    fetchAnalyses: campaigns.fetchAnalyses,
  };

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysisContext() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysisContext must be used within AnalysisProvider');
  }
  return context;
}
