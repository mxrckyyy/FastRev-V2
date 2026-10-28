import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

// Application header with responsive mobile navigation.
export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Home' },
    ...(isAuthenticated
      ? [
          { to: '/dashboard', label: 'Dashboard' },
          { to: '/generate', label: 'Generate' },
        ]
      : []),
  ];

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') setMobileOpen(false);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-h-11 items-center gap-2 rounded-md font-semibold tracking-tight text-foreground">
          <BookOpen className="h-5 w-5 text-primary" strokeWidth={2.2} />
          <span>FastRev</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.filter((link) => link.to !== '/').map((link) => (
            <Button
              key={link.to}
              variant={isActive(link.to) ? 'secondary' : 'ghost'}
              size="sm"
              asChild
            >
              <Link to={link.to} aria-current={isActive(link.to) ? 'page' : undefined}>{link.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <>
              <span className="max-w-48 truncate text-sm text-muted-foreground">{user?.email}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/" aria-current={isActive('/') ? 'page' : undefined}>Home</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Sign up</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent active:scale-[0.98] md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t bg-background md:hidden">
          <nav id="mobile-navigation" className="mx-auto max-w-7xl space-y-1 px-4 py-3 sm:px-6" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                aria-current={isActive(link.to) ? 'page' : undefined}
                className={`flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-medium transition-colors active:scale-[0.99] ${
                  isActive(link.to)
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <div className="pt-2">
                <p className="truncate px-3 py-1 text-xs text-muted-foreground">{user?.email}</p>
                <Button variant="ghost" className="h-11 w-full justify-start" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button variant="outline" size="lg" className="w-full" asChild>
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    Log in
                  </Link>
                </Button>
                <Button size="lg" className="w-full" asChild>
                  <Link to="/register" onClick={() => setMobileOpen(false)}>
                    Get started
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
