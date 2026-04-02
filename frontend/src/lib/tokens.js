// Design token utilities for JS access when CSS custom properties aren't enough

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  6: '24px',
  8: '32px',
  12: '48px',
  16: '64px',
};

export const radii = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  full: '9999px',
};

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export const typeSizes = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.25rem',
  xl: '1.5rem',
  '2xl': '2rem',
  '3xl': '2.5rem',
};

// Component size scale — consistent across Button, Input, Badge, etc.
export const componentSizes = {
  sm: { px: '12px', py: '6px', text: '0.75rem' },
  md: { px: '16px', py: '8px', text: '0.875rem' },
  lg: { px: '24px', py: '12px', text: '1rem' },
};
