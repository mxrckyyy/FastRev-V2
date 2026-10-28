import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Manage your flashcard decks.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your decks</CardTitle>
          <CardDescription>Deck management is implemented in Phase 7.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No decks yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
