import 'dotenv/config';
import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { closeDb } from './db/client.js';

const server = serve({ fetch: createApp().fetch, port: env.PORT }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close();
    void closeDb().finally(() => process.exit(0));
  });
}
