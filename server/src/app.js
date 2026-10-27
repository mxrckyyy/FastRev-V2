// Express application factory. Detailed middleware/routes are added in Phase 1.
import express from 'express';

export function createApp() {
  const app = express();
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  return app;
}

export default createApp;