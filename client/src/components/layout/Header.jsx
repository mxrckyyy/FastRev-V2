import { Link } from 'react-router-dom';
import { BookOpen, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Minimal application header shell. Auth-aware behavior is added in Phase 7.
export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <BookOpen className="h-5 w-5 text-primary" />
          <span>FastRev</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Log in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/register">Sign up</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}