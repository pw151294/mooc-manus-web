import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import AgentPage from '@/pages/Agent';
import AppConfigPage from '@/pages/AppConfig';
import ToolProvidersPage from '@/pages/Tool/Providers';
import ToolFunctionsPage from '@/pages/Tool/Functions';
import SkillPage from '@/pages/Skill';
import TracePage from '@/pages/Trace';
import EvalCasesPage from '@/pages/Eval/Cases';
import EvalTasksPage from '@/pages/Eval/Tasks';
import TaskDetailPage from '@/pages/Eval/TaskDetail';

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
      {
        path: 'eval/cases',
        element: <EvalCasesPage />,
      },
      {
        path: 'eval/tasks',
        element: <EvalTasksPage />,
      },
      {
        path: 'eval/tasks/:id',
        element: <TaskDetailPage />,
      },
    ],
  },
]);

export default router;
