const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './production-e2e',
  fullyParallel: false,
  retries: 0,
  timeout: 180_000,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.PRODUCTION_BASE_URL || 'https://factorymesh.vercel.app',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
