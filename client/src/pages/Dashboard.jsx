import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, BookOpen, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingState from '@/components/ui/loading-state';
import ErrorState from '@/components/ui/error-state';
import EmptyState from '@/components/ui/empty-state';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { useToast } from '@/lib/toast';

export default function Dashboard() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const fetchDecks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/api/decks', { token });
      setDecks(data.decks || []);
    } catch (err) {
      setError(err.message || 'Failed to load decks.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  async function handleDelete(deckId) {
    if (!window.confirm('Delete this deck and all its cards? This cannot be undone.')) return;
    setDeletingId(deckId);
    setDeleteError('');
    try {
      await apiRequest(`/api/decks/${deckId}`, { method: 'DELETE', token });
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
      toast({ title: 'Deck deleted', description: 'The deck and its cards have been removed.', variant: 'success' });
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete deck.');
      toast({ title: 'Deletion failed', description: err.message || 'Failed to delete deck.', variant: 'error' });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your flashcard decks.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchDecks} disabled={loading} className="min-h-[44px] px-4">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild>
            <Link to="/generate">
              <Plus className="mr-2 h-4 w-4" />
              Create deck
            </Link>
          </Button>
        </div>
      </div>

      {deleteError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {deleteError}
        </div>
      )}

      {loading && <LoadingState message="Loading your decks..." />}

      {error && !loading && (
        <ErrorState message={error} onRetry={fetchDecks} />
      )}

      {!loading && !error && decks.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="No decks yet"
          description="Generate flashcards from study material to create your first deck."
          actionLabel="Create your first deck"
          actionTo="/generate"
        />
      )}

      {!loading && !error && decks.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <Card key={deck.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="line-clamp-2 text-lg">{deck.title}</CardTitle>
                <CardDescription>
                  {deck.cardCount} {deck.cardCount === 1 ? 'card' : 'cards'}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex gap-2">
                <Button asChild className="flex-1" size="sm">
                  <Link to={`/decks/${deck.id}`}>Study</Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(deck.id)}
                  disabled={deletingId === deck.id}
                  className="min-h-[44px] min-w-[44px]"
                  aria-label={`Delete deck ${deck.title}`}
                >
                  {deletingId === deck.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
