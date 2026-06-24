import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { buildOpenApiDocument } from '@/common/openapi';
import { onError } from '@/common/errors';
import type { AppEnv } from '@/common/types';
import { env } from '@/config/env';
import { localeMiddleware } from '@/middleware/locale';
import { apiRoutes } from '@/routes';

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
