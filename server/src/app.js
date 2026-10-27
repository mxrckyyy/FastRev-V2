// Express application factory. Separated from server startup for testability.
import express from 'express';
import cors from 'cors';
import env, { validateEnv } from './config/env.js';
import { isDbConnected } from './config/db.js';
import requestLogger from './middleware/requestLogger.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

validateEnv();

export function createApp() {
  const app = express();

  // CORS restricted to configured frontend origin.
  app.use(
    cors({
      origin: env.frontendOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    })
  );

  // JSON body parsing with a reasonable size limit.
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use(requestLogger);

  // Health endpoint: reports status and DB connectivity without secrets.
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      database: isDbConnected() ? 'connected' : 'disconnected',
    });
  });

  // Route registration placeholder (expanded in later phases).

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;