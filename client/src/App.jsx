import React from 'react';

// Root component. Routing and providers are added in later phases.
export default function App() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold">FastRev</h1>
        <p className="mt-2 text-slate-600">
          AI-powered flashcards. Application features are implemented in subsequent phases.
        </p>
      </main>
    </div>
  );
}