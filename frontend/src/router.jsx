import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import HomePage from './pages/HomePage';
import CampaignPage from './pages/CampaignPage';
import AnalysisPage from './pages/AnalysisPage';
import NotFoundPage from './pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'campaign/:id', element: <CampaignPage /> },
      { path: 'analysis/:id', element: <AnalysisPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
