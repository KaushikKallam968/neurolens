import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { Skeleton } from './components/ui';

// Code-split heavy pages — Three.js + charts only load when needed
const HomePage = lazy(() => import('./pages/HomePage'));
const CampaignPage = lazy(() => import('./pages/CampaignPage'));
const AnalysisPage = lazy(() => import('./pages/AnalysisPage'));
const SharePage = lazy(() => import('./pages/SharePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function PageFallback() {
  return (
    <div className="mt-12 flex flex-col gap-4 px-5">
      <Skeleton width="40%" height="2rem" />
      <Skeleton width="100%" height="64px" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <Skeleton width="100%" height="280px" rounded="var(--radius-lg)" />
        </div>
        <div className="lg:col-span-3">
          <Skeleton width="100%" height="280px" rounded="var(--radius-lg)" />
        </div>
      </div>
    </div>
  );
}

function SuspensePage({ children }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <SuspensePage><HomePage /></SuspensePage> },
      { path: 'campaign/:id', element: <SuspensePage><CampaignPage /></SuspensePage> },
      { path: 'analysis/:id', element: <SuspensePage><AnalysisPage /></SuspensePage> },
      { path: 'share/:token', element: <SuspensePage><SharePage /></SuspensePage> },
      { path: '*', element: <SuspensePage><NotFoundPage /></SuspensePage> },
    ],
  },
]);
