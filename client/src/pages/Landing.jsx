import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Landing() {
  return (
    <section className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          FastRev
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
          Turn your study material into flashcards with AI assistance. Review, edit, and save your own decks.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="w-full sm:w-auto">
            <Link to="/register">Get started</Link>
          </Button>
          <Button variant="outline" asChild className="w-full sm:w-auto">
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
