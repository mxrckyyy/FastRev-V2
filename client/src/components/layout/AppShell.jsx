import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';

// Responsive application shell with consistent spacing.
export default function AppShell({ children }) {
  const mainRef = useRef(null);
  const location = useLocation();
  const hasMounted = useRef(false);

  useEffect(() => {
    // Skip focus management on initial application mount
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    // Move focus to main content on route change for keyboard/screen reader users
    if (mainRef.current) {
      mainRef.current.focus({ preventScroll: false });
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Header />
      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 outline-none"
      >
        {children}
      </main>
    </div>
  );
}
