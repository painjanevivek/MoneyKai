import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 19006);
const host = process.env.PLAYWRIGHT_HOST ?? 'localhost';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://${host}:${port}`;

export default defineConfig({
  testDir: './playwright/e2e',
  fullyParallel: true,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: `npm --prefix apps/MoneyKai-web run web -- --port ${port} --host ${host}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      EXPO_PUBLIC_BACKEND_BASE_URL: '',
      EXPO_PUBLIC_FINANCIAL_AI_ENABLED: 'false',
      EXPO_PUBLIC_GMAIL_SYNC_ENABLED: 'false',
      EXPO_PUBLIC_SENTRY_DSN: '',
      EXPO_PUBLIC_FIREBASE_API_KEY: 'placeholder-api-key',
      EXPO_PUBLIC_FIREBASE_APP_ID: '1:000000000000:web:placeholder',
      EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'placeholder.firebaseapp.com',
      EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'placeholder-project',
      EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: 'placeholder.appspot.com',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
