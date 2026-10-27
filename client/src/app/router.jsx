import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Generate from '@/pages/Generate';
import DeckDetail from '@/pages/DeckDetail';
import NotFound from '@/pages/NotFound';

// Route configuration for Phase 1 foundation. Auth guards added in Phase 3/7.
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell><Landing /></AppShell>,
  },
  {
    path: '/login',
    element: <AppShell><Login /></AppShell>,
  },
  {
    path: '/register',
    element: <AppShell><Register /></AppShell>,
  },
  {
    path: '/dashboard',
    element: <AppShell><Dashboard /></AppShell>,
  },
  {
    path: '/generate',
    element: <AppShell><Generate /></AppShell>,
  },
  {
    path: '/decks/:id',
    element: <AppShell><DeckDetail /></AppShell>,
  },
  {
    path: '*',
    element: <AppShell><NotFound /></AppShell>,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

export default AppRouter;