import { useState, useCallback, useEffect } from 'react';
import { listAnalyses as sbListAnalyses, getAnalysis as sbGetAnalysis, saveAnalysis } from '../lib/supabase';

export function useCampaigns({ getApiUrl }) {
  const [analyses, setAnalyses] = useState([]);

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

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  const loadAnalysis = useCallback(async (analysisId) => {
    try {
      // Try Supabase first
      const sbData = await sbGetAnalysis(analysisId);
      if (sbData?.data) {
        return {
          analysisId: sbData.analysis_id,
          filename: sbData.filename,
          status: sbData.status,
          data: sbData.data,
        };
      }
      // Fall back to local API
      const response = await fetch(getApiUrl(`/api/results/${analysisId}`));
      if (!response.ok) throw new Error('Failed to load analysis');
      return await response.json();
    } catch (err) {
      throw err;
    }
  }, [getApiUrl]);

  const persistAnalysis = useCallback((data) => {
    if (data?.data) {
      saveAnalysis(
        data.analysisId,
        data.filename,
        data.data.neuralScore,
        data.data.percentile,
        data.data
      );
    }
    fetchAnalyses();
  }, [fetchAnalyses]);

  return {
    analyses,
    fetchAnalyses,
    loadAnalysis,
    persistAnalysis,
  };
}
