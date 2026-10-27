import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Generate() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Generate flashcards</h1>
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