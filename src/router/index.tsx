import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import AgentPage from '@/pages/Agent';
import AppConfigPage from '@/pages/AppConfig';
import ToolProvidersPage from '@/pages/Tool/Providers';
import ToolFunctionsPage from '@/pages/Tool/Functions';
import SkillPage from '@/pages/Skill';
import TracePage from '@/pages/Trace';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/agent" replace />,
      },
      {
        path: 'agent',
        element: <AgentPage />,
      },
      {
        path: 'model-config',
        element: <AppConfigPage />,
      },
      {
        path: 'tools/providers',
        element: <ToolProvidersPage />,
      },
      {
        path: 'tools/functions',
        element: <ToolFunctionsPage />,
      },
      {
        path: 'skills',
        element: <SkillPage />,
      },
      {
        path: 'traces',
        element: <TracePage />,
      },
    ],
  },
]);

export default router;
