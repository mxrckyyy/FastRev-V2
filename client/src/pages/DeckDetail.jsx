import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DeckDetail() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Deck</h1>
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