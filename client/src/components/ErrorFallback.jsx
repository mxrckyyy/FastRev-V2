import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function ErrorFallback({ onReset }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          An unexpected error occurred. Please try again or return to the home page.
        </p>
      </div>
      <div className="flex gap-3">
        {onReset && (
          <Button onClick={onReset} variant="outline">
            Try again
          </Button>
        )}
        <Button onClick={() => (window.location.href = '/')}>
          Go home
        </Button>
      </div>
    </div>
  );
}
