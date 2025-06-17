import env from './lib/env';

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { showRoutes } from 'hono/dev';
import { logger as httpLogger } from 'hono/logger';
import { trimTrailingSlash } from 'hono/trailing-slash';

import { NODE_ENVIRONMENTS } from './lib/constants';
import { tracing } from './api/middlewares/tracing';
import { serveInternalServerError, serveNotFound } from './utils/responses';
import { clerkMiddleware } from '@hono/clerk-auth';
import { chatRouter } from './features/chat/chat-route-handler';
import { dbConnectionRouter } from './features/user-db/database-route-handler';
import { webhookRouter } from './features/webhooks/webhook-router';
import { logger } from './lib/logger';
import { initializeQueue, shutdownQueue } from './queue/setup';
import { timing } from 'hono/timing';

const app = new Hono();

initializeQueue().then(() => {
  app.use(cors());
  app.use(timing());
  app.use(tracing);
  app.use(httpLogger());
  app.use(trimTrailingSlash());

  app.notFound((c) => {
    return serveNotFound(c);
  });
  app.onError((err, c) => {
    console.log(err);
    return serveInternalServerError(c, err);
  });

  app.use('*', clerkMiddleware());
  app.get('/', (c) => c.text('Hello 👋'));
  app.get('/health', (c) => c.text('Ok'));
  app.route('/chat', chatRouter);
  app.route('/db', dbConnectionRouter);
  app.route('/webhook', webhookRouter);

  if (env.NODE_ENV === NODE_ENVIRONMENTS.development) {
    console.log('Available routes:');
    showRoutes(app);
  }
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received');

  logger.info('shutting down queue');
  await shutdownQueue();

  logger.info('Exiting...');
  process.exit(0);
});

export default {
  app: env.PORT,
  fetch: app.fetch,
};
