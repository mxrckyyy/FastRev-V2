import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Loader2, AlertCircle, ChevronLeft, ChevronRight, Eye, EyeOff, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/api';

export default function DeckDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Study state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const fetchDeck = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest(`/api/decks/${id}`, { token });
      setDeck(data.deck);
      setCards(data.cards || []);
      setCurrentIndex(0);
      setShowAnswer(false);
    } catch (err) {
      if (err.status === 404) {
        setError('Deck not found.');
      } else {
        setError(err.message || 'Failed to load deck.');
      }
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchDeck();
  }, [fetchDeck]);

  async function handleDelete() {
    if (!window.confirm('Delete this deck and all its cards? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await apiRequest(`/api/decks/${id}`, { method: 'DELETE', token });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to delete deck.');
      setDeleting(false);
    }
  }

  function goNext() {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
      setShowAnswer(false);
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setShowAnswer(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchDeck}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!deck) return null;

  const currentCard = cards[currentIndex];
  const hasCards = cards.length > 0;
  const isLast = currentIndex === cards.length - 1;
  const isFirst = currentIndex === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link to="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{deck.title}</h1>
          <p className="text-sm text-muted-foreground">
            {cards.length} {cards.length === 1 ? 'card' : 'cards'}
          </p>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting} className="min-h-[36px]">
          {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
          {deleting ? 'Deleting...' : 'Delete deck'}
        </Button>
      </div>

      {/* Study area */}
      {!hasCards ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
            <div className="space-y-1">
              <p className="font-medium">No cards in this deck</p>
              <p className="text-sm text-muted-foreground">
                Generate flashcards to add cards to this deck.
              </p>
            </div>
            <Button asChild>
              <Link to="/generate">Generate cards</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Progress */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Card {currentIndex + 1} of {cards.length}
            </span>
            <span>{Math.round(((currentIndex + 1) / cards.length) * 100)}%</span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            />
          </div>

          {/* Card */}
          <Card className="min-h-[280px]">
            <CardHeader>
              <CardDescription className="text-xs font-medium uppercase tracking-wide">
                {showAnswer ? 'Answer' : 'Question'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="whitespace-pre-wrap text-base leading-relaxed sm:text-lg">
                {showAnswer ? currentCard.answer : currentCard.question}
              </p>

              <Button
                variant={showAnswer ? 'outline' : 'default'}
                onClick={() => setShowAnswer((s) => !s)}
                className="w-full sm:w-auto"
              >
                {showAnswer ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Hide answer
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Reveal answer
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={goPrev} disabled={isFirst} className="flex-1 sm:flex-none">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>

            {isLast ? (
              <Button variant="secondary" onClick={() => { setCurrentIndex(0); setShowAnswer(false); }} className="flex-1 sm:flex-none">
                Restart
              </Button>
            ) : (
              <Button onClick={goNext} className="flex-1 sm:flex-none">
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
