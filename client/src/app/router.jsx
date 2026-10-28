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
    element: <AppShell><ProtectedRoute><Dashboard /></ProtectedRoute></AppShell>,
  },
  {
    path: '/generate',
    element: <AppShell><ProtectedRoute><Generate /></ProtectedRoute></AppShell>,
  },
  {
    path: '/decks/:id',
    element: <AppShell><ProtectedRoute><DeckDetail /></ProtectedRoute></AppShell>,
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
