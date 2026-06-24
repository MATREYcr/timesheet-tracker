// Factory so tests can spin up a fresh instance.

import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { buildOpenApiDocument } from './common/openapi.js';
import { onError } from './common/errors/index.js';
import type { AppEnv } from './common/types.js';
import { env } from './config/env.js';
import { localeMiddleware } from './middleware/locale.js';
import { apiRoutes } from './routes/index.js';

export function createApp() {
  const app = new OpenAPIHono<AppEnv>();

  app.use('*', logger());
  app.use('*', cors({ origin: env.CORS_ORIGIN }));
  app.use('*', localeMiddleware);

  app.get('/health', (c) => c.json({ status: 'ok' }));

  app.route('/', apiRoutes);

  const openApiDocument = buildOpenApiDocument(app);
  app.get('/openapi', (c) => c.json(openApiDocument));
  app.get('/docs', swaggerUI({ url: '/openapi' }));

  app.onError(onError);

  
  return app;
}

export type AppType = ReturnType<typeof createApp>;
