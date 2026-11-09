import { AuthProvider } from './lib/auth';
import { ToastProvider } from './lib/toast';
import AppRouter from './app/router';
import ErrorBoundary from './components/ErrorBoundary';
import Toaster from './components/ui/toaster';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AppRouter />
          <Toaster />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
