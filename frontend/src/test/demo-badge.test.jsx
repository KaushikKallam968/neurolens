import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock with DEMO_MODE = true
vi.mock('../lib/supabase', () => ({
  DEMO_MODE: true,
  USE_EDGE: false,
  supabase: { from: vi.fn(), storage: { from: vi.fn() } },
}));

import DemoModeBadge from '../components/DemoModeBadge';

describe('DemoModeBadge', () => {
  it('shows DEMO badge when DEMO_MODE is true', () => {
    render(<DemoModeBadge />);
    expect(screen.getByText('DEMO')).toBeInTheDocument();
  });
});
