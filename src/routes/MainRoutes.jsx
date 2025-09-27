import { lazy } from 'react';

// project imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';

// render- Dashboard
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));

// render - color
const Color = Loadable(lazy(() => import('pages/component-overview/color')));
const Typography = Loadable(lazy(() => import('pages/component-overview/typography')));
const Shadow = Loadable(lazy(() => import('pages/component-overview/shadows')));

// render - sample page
const SamplePage = Loadable(lazy(() => import('pages/extra-pages/sample-page')));
const DatabaseTest = Loadable(lazy(() => import('pages/extra-pages/database-test')));
const TestAuth = Loadable(lazy(() => import('pages/test/TestAuth')));

// render - directories
const WorksPage = Loadable(lazy(() => import('pages/directories/works')));
const MaterialsPage = Loadable(lazy(() => import('pages/directories/materials')));

// render - projects
const CreateProject = Loadable(lazy(() => import('pages/projects/CreateProject')));
const ProjectStorage = Loadable(lazy(() => import('pages/projects/ProjectStorage')));

// render - calculations
const EstimateCalculationPage = Loadable(lazy(() => import('pages/calculations/estimate')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: <DashboardLayout />,
  children: [
    {
      path: '/',
      element: <DashboardDefault />
    },
    {
      path: 'dashboard',
      children: [
        {
          path: 'default',
          element: <DashboardDefault />
        }
      ]
    },
    {
      path: 'typography',
      element: <Typography />
    },
    {
      path: 'color',
      element: <Color />
    },
    {
      path: 'shadow',
      element: <Shadow />
    },
    {
      path: 'sample-page',
      element: <SamplePage />
    },
    {
      path: 'database-test',
      element: <DatabaseTest />
    },
    {
      path: 'test-auth',
      element: <TestAuth />
    },
    {
      path: 'directories',
      children: [
        {
          path: 'works',
          element: <WorksPage />
        },
        {
          path: 'materials',
          element: <MaterialsPage />
        }
      ]
    },
    {
      path: 'projects',
      children: [
        {
          path: 'create',
          element: <CreateProject />
        },
        {
          path: 'storage',
          element: <ProjectStorage />
        }
      ]
    },
    {
      path: 'calculations',
      children: [
        {
          path: 'estimate',
          element: <EstimateCalculationPage />
        }
      ]
    }
  ]
};

export default MainRoutes;
