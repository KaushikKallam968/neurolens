export const colors = {
  background: '#0B1120',
  surface: '#111827',
  card: '#1F2937',
  cardBorder: 'rgba(255,255,255,0.05)',
  cardBorderHover: 'rgba(255,255,255,0.1)',
  cyan: '#00D4FF',
  coral: '#FF6B6B',
  emerald: '#10B981',
  amber: '#F59E0B',
  purple: '#8B5CF6',
  pink: '#EC4899',
  orange: '#F97316',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
};

export const metricColors = {
  emotionalResonance: colors.coral,
  attentionFocus: colors.amber,
  memorability: colors.purple,
  narrativeComprehension: colors.cyan,
  faceImpact: colors.pink,
  sceneImpact: colors.emerald,
  motionEnergy: colors.orange,
};

export const metricLabels = {
  emotionalResonance: 'Emotional Resonance',
  attentionFocus: 'Attention Focus',
  memorability: 'Memorability',
  narrativeComprehension: 'Narrative Comprehension',
  faceImpact: 'Face Impact',
  sceneImpact: 'Scene Impact',
  motionEnergy: 'Motion Energy',
};

export function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
