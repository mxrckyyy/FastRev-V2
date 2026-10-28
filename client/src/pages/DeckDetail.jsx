import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DeckDetail() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Deck</h1>
        <p className="text-sm text-muted-foreground">Study your flashcards.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Study</CardTitle>
          <CardDescription>Deck study experience is implemented in Phase 9.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cards will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
