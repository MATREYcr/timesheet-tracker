import { defineConfig } from '@playwright/test'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '.env.test') })

export default defineConfig({
  globalSetup: require.resolve('./src/global-setup'),
  testDir: './src',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'en-US',
    // Signed in as the run's E2E user (see src/global-setup.ts).
    storageState: '.auth/user.json',
  },
})
