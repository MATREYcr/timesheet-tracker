import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/api',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    name: '@timesheet/api',
    watch: false,
    globals: true,
    passWithNoTests: true,
    environment: 'node',
    setupFiles: ['dotenv/config'],
    // Provision + migrate the isolated test DB (timesheet_test) once per run.
    globalSetup: ['./test/global-setup.ts'],
    // Integration tests share the one test DB, so run files serially (each truncates
    // in beforeAll); parallel files would race on TRUNCATE vs. inserts.
    fileParallelism: false,
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
