// API entrypoint. Loads env (repo-root .env when run via `nx serve`), then starts
// the Hono app on the Node server.

import 'dotenv/config';
import { serve } from '@hono/node-server';
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3333);

serve({ fetch: createApp().fetch, port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});
