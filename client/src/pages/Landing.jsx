import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Landing() {
  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">FastRev</h1>
        <p className="max-w-2xl text-muted-foreground">
          Turn your study material into flashcards with AI assistance. Review, edit, and save your own decks.
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link to="/register">Get started</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/login">Log in</Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Foundation ready</CardTitle>
          <CardDescription>Application features are implemented in subsequent phases.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            FastRev uses free AI providers. There is no application-imposed daily quota.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}