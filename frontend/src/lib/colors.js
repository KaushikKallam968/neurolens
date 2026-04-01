export const colors = {
  void: '#060B14',
  depth1: '#0C1322',
  depth2: '#121B2E',
  depth3: '#1A2540',
  depth4: '#243052',
  primary: '#6C9FFF',
  scoreHigh: '#00E5A0',
  scoreMid: '#FFB547',
  scoreLow: '#FF5C5C',
  textBright: '#E8EDF5',
  textMain: '#A4B3CC',
  textDim: '#5E6E87',
  textGhost: '#3A4A63',
};

export const metricColors = {
  emotionalResonance: '#FF6B8A',
  attentionFocus: '#FFB547',
  memorability: '#B57FFF',
  narrativeComprehension: '#6C9FFF',
  faceImpact: '#FF8ED4',
  sceneImpact: '#00E5A0',
  motionEnergy: '#FF9F43',
};

export const metricLabels = {
  emotionalResonance: 'Emotion',
  attentionFocus: 'Attention',
  memorability: 'Memory',
  narrativeComprehension: 'Comprehension',
  faceImpact: 'Face Response',
  sceneImpact: 'Scene Impact',
  motionEnergy: 'Motion',
};

export const metricDescriptions = {
  emotionalResonance: 'How strongly the content triggers emotional brain regions',
  attentionFocus: 'Active engagement and focus from prefrontal cortex',
  memorability: 'Hippocampal encoding — likelihood of being remembered',
  narrativeComprehension: 'Language processing and narrative understanding',
  faceImpact: 'Fusiform face area activation from on-screen faces',
  sceneImpact: 'Visual cortex response to environments and scenes',
  motionEnergy: 'Neural response to dynamic movement and kinetic energy',
};

export function getScoreColor(score) {
  if (score >= 70) return colors.scoreHigh;
  if (score >= 45) return colors.scoreMid;
  return colors.scoreLow;
}

export function getScoreLabel(score) {
  if (score >= 85) return 'Exceptional neural engagement across all dimensions';
  if (score >= 70) return 'Strong response — content is working well';
  if (score >= 55) return 'Moderate engagement with clear optimization opportunities';
  if (score >= 40) return 'Below average — significant room for improvement';
  return 'Low engagement — content needs rethinking';
}

export function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
