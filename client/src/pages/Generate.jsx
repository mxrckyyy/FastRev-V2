import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/api';

export default function Generate() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [material, setMaterial] = useState('');
  const [title, setTitle] = useState('');
  const [cardCount, setCardCount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const trimmedMaterial = material.trim();
    if (!trimmedMaterial) {
      setError('Study material is required.');
      return;
    }
    if (trimmedMaterial.length > 20000) {
      setError('Study material exceeds 20,000 characters.');
      return;
    }

    setLoading(true);
    try {
      const body = { material: trimmedMaterial };
      if (title.trim()) body.title = title.trim();
      if (cardCount) {
        const count = parseInt(cardCount, 10);
        if (!isNaN(count) && count >= 1 && count <= 50) {
          body.cardCount = count;
        }
      }

      const data = await apiRequest('/api/generate', {
        method: 'POST',
        body,
        token,
      });

      // Navigate to the newly created deck
      navigate(`/decks/${data.deck.id}`, { replace: true });
    } catch (err) {
      setError(err.message || 'Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const charCount = material.length;
  const isOverLimit = charCount > 20000;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Generate flashcards</h1>
        <p className="text-sm text-muted-foreground">
          Paste your study material and let AI create flashcards for you.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Study material</CardTitle>
          <CardDescription>Enter the text you want to turn into flashcards.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="material">Study material</Label>
              <Textarea
                id="material"
                placeholder="Paste your notes, textbook excerpts, or study material here..."
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="min-h-[200px] resize-y"
                required
              />
              <div className="flex justify-end">
                <span className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {charCount.toLocaleString()} / 20,000
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Deck title (optional)</Label>
                <Input
                  id="title"
                  placeholder="Defaults to Study Deck - today's date"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardCount">Number of cards (optional)</Label>
                <Input
                  id="cardCount"
                  type="number"
                  min="1"
                  max="50"
                  placeholder="AI decides"
                  value={cardCount}
                  onChange={(e) => setCardCount(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            <Button type="submit" className="w-full sm:w-auto" disabled={loading || !material.trim() || isOverLimit}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate flashcards
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
