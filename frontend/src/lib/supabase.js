import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hxevptffvdhslexjykgy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZXZwdGZmdmRoc2xleGp5a2d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNzk0MTQsImV4cCI6MjA5MDY1NTQxNH0.463as0C1qodVIiejfsmdXdTD9koqkUPcTTOw0fSJ0kU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function getGpuUrl() {
  const { data } = await supabase
    .from('gpu_status')
    .select('gpu_url, status, engine, updated_at')
    .eq('id', 'default')
    .single();

  if (data?.status === 'online' && data?.gpu_url) {
    return data.gpu_url;
  }
  return null;
}

export async function saveAnalysis(analysisId, filename, neuralScore, percentile, fullData) {
  const { error } = await supabase.from('analyses').upsert({
    analysis_id: analysisId,
    status: 'complete',
    filename,
    neural_score: neuralScore,
    percentile,
    data: fullData,
    completed_at: new Date().toISOString(),
  });
  if (error) console.error('Failed to save to Supabase:', error);
}

export async function listAnalyses() {
  const { data } = await supabase
    .from('analyses')
    .select('analysis_id, filename, neural_score, percentile, created_at, completed_at')
    .eq('status', 'complete')
    .order('completed_at', { ascending: false })
    .limit(50);
  return data || [];
}

export async function getAnalysis(analysisId) {
  const { data } = await supabase
    .from('analyses')
    .select('*')
    .eq('analysis_id', analysisId)
    .single();
  return data;
}

export async function uploadVideo(file, analysisId) {
  const path = `${analysisId}/${file.name}`;
  const { error } = await supabase.storage
    .from('videos')
    .upload(path, file);
  if (error) console.error('Video upload failed:', error);
  return path;
}

export function getVideoUrl(path) {
  const { data } = supabase.storage.from('videos').getPublicUrl(path);
  return data?.publicUrl;
}
