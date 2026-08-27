import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.HEXFRONT_TEST_PORT) || 4173;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/browser',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  use: { baseURL, trace: 'retain-on-failure' },
  webServer: {
    command: `node ./node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30_000,
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile-portrait', use: { browserName: 'chromium', viewport: { width: 390, height: 844 } } },
  ],
});
