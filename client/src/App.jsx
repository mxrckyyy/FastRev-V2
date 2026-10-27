import AppRouter from './app/router';

// Root component. Providers (auth, etc.) are added in later phases.
export default function App() {
  return <AppRouter />;
}