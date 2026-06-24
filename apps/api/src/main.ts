import 'dotenv/config';
import { serve } from '@hono/node-server';
import { createApp } from '@/app';
import { env } from '@/config/env';
import { closeDb } from '@/db/client';

const server = serve({ fetch: createApp().fetch, port: env.PORT }, (info) => {
  const host = info.address === '::' || info.address === '0.0.0.0' ? 'localhost' : info.address;
  console.log(`API listening on http://${host}:${info.port} [${env.NODE_ENV}]`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => {
      void closeDb().finally(() => process.exit(0));
    });
  });
}
