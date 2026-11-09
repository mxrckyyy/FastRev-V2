import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Generate from '@/pages/Generate';
import DeckDetail from '@/pages/DeckDetail';
import NotFound from '@/pages/NotFound';
import ErrorFallback from '@/components/ErrorFallback';

const errorElement = <AppShell><ErrorFallback /></AppShell>;

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell><Landing /></AppShell>,
    errorElement,
  },
  {
    path: '/login',
    element: <AppShell><Login /></AppShell>,
    errorElement,
  },
  {
    path: '/register',
    element: <AppShell><Register /></AppShell>,
    errorElement,
  },
  {
    path: '/dashboard',
    element: <AppShell><ProtectedRoute><Dashboard /></ProtectedRoute></AppShell>,
    errorElement,
  },
  {
    path: '/generate',
    element: <AppShell><ProtectedRoute><Generate /></ProtectedRoute></AppShell>,
    errorElement,
  },
  {
    path: '/decks/:id',
    element: <AppShell><ProtectedRoute><DeckDetail /></ProtectedRoute></AppShell>,
    errorElement,
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
