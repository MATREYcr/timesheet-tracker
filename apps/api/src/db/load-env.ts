// Side-effect import that loads the repo-root .env. Import this BEFORE any module
// that reads process.env (e.g. ./client.js) in standalone scripts (seed).

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, '../../../../.env') });
