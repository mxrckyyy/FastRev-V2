import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Generate() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Generate flashcards</h1>
        <p className="text-sm text-muted-foreground">
          Paste your study material to generate flashcards with AI.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Study material</CardTitle>
          <CardDescription>Generation workflow is implemented in Phase 8.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Paste your study material here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
