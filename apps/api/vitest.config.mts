import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/api',
  test: {
    name: '@timesheet/api',
    watch: false,
    globals: true,
    passWithNoTests: true,
    environment: 'node',
    // Loads the repo-root .env so DATABASE_URL is available to integration tests.
    setupFiles: ['./src/db/load-env.ts'],
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
