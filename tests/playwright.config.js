import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'features/*.feature',
  steps: 'steps/*.js',
});

// Each content set is built with Hugo and served as Static Web Apps serves it.
const sites = [
  ['fixtures/content', 1313],
  ['fixtures/empty', 1314],
];

export default defineConfig({
  testDir,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:1313',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: sites.map(([content, port]) => ({
    command: `node serve.js ${content} ${port}`,
    url: `http://localhost:${port}/404.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  })),
});
