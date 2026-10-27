import env from './config/env.js';
import { createApp } from './app.js';
import { connectDb } from './config/db.js';

const app = createApp();
const port = env.port;

async function start() {
  try {
    await connectDb();
    // eslint-disable-next-line no-console
    console.log('[db] MongoDB connected');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[db] MongoDB connection failed:', err?.message);
  }

  const server = app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`FastRev server listening on port ${port}`);
  });

  const shutdown = async () => {
    server.close(() => {
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();