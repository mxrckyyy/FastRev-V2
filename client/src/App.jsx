import { AuthProvider } from './lib/auth';
import AppRouter from './app/router';

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
