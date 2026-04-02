import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

// Mock Three.js and related — not needed for router tests
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }) => <div data-testid="canvas">{children}</div>,
  useFrame: vi.fn(),
  useThree: () => ({ gl: {}, scene: {}, camera: {} }),
}));
vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Html: ({ children }) => <div>{children}</div>,
}));
vi.mock('three', () => ({
  BufferGeometry: vi.fn(),
  BufferAttribute: vi.fn(),
  Float32BufferAttribute: vi.fn(),
  MeshStandardMaterial: vi.fn(),
  Color: vi.fn(),
  Vector3: vi.fn(),
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  AreaChart: ({ children }) => <div>{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
  RadarChart: ({ children }) => <div>{children}</div>,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  PolarRadiusAxis: () => null,
  Radar: () => null,
  BarChart: ({ children }) => <div>{children}</div>,
  Bar: () => null,
  LineChart: ({ children }) => <div>{children}</div>,
  Line: () => null,
  Legend: () => null,
}));
// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn(), storage: { from: vi.fn() } },
  getGpuUrl: vi.fn(() => Promise.resolve(null)),
  saveAnalysis: vi.fn(),
  listAnalyses: vi.fn(() => Promise.resolve([])),
  getAnalysis: vi.fn(() => Promise.resolve(null)),
  uploadVideo: vi.fn(),
  getVideoUrl: vi.fn(),
  DEMO_MODE: false,
  USE_EDGE: false,
}));

import App from '../App';
import NotFoundPage from '../pages/NotFoundPage';

function renderWithRouter(initialEntries = ['/']) {
  const routes = [
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <div data-testid="home-page">Home</div> },
        { path: 'campaign/:id', element: <div data-testid="campaign-page">Campaign</div> },
        { path: 'analysis/:id', element: <div data-testid="analysis-page">Analysis</div> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ];

  const router = createMemoryRouter(routes, { initialEntries });
  return render(<RouterProvider router={router} />);
}

describe('Router', () => {
  it('renders home page at /', () => {
    renderWithRouter(['/']);
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('renders campaign page at /campaign/:id', () => {
    renderWithRouter(['/campaign/abc123']);
    expect(screen.getByTestId('campaign-page')).toBeInTheDocument();
  });

  it('renders analysis page at /analysis/:id', () => {
    renderWithRouter(['/analysis/xyz789']);
    expect(screen.getByTestId('analysis-page')).toBeInTheDocument();
  });

  it('renders 404 for unknown routes', () => {
    renderWithRouter(['/nonexistent']);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders NeuroLens header on all routes', () => {
    renderWithRouter(['/']);
    expect(screen.getByText('Neuro')).toBeInTheDocument();
    expect(screen.getByText('Lens')).toBeInTheDocument();
  });

  it('provides skip-to-content link for accessibility', () => {
    renderWithRouter(['/']);
    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });
});
