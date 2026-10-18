import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
import { defineBddConfig } from 'playwright-bdd';

// The cloud sandbox ships one Chromium that may not match the pinned Playwright. Use it when present;
// CI and laptops use the browser `playwright install` fetched.
const sandboxChromium = '/opt/pw-browsers/chromium';
const executablePath = process.env.CHROMIUM_PATH || (existsSync(sandboxChromium) ? sandboxChromium : undefined);

const testDir = defineBddConfig({
  features: 'features/*.feature',
  steps: 'steps/*.js',
});

// Each content set is built with Eleventy and served as Static Web Apps serves it.
// Every server builds with fixture settings, never Paul's site/data/settings.yaml.
const sites = [
  ['fixtures/content', 1313, '--uploads --data fixtures/data/no-key'],
  ['fixtures/empty', 1314, '--data fixtures/data/no-key'],
  ['fixtures/content', 1315, '--uploads --data fixtures/data/with-key'],
];

export default defineConfig({
  testDir,
  // Kept in tests/ now that package.json is at the repo root.
  outputDir: 'test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]] : 'list',
  use: {
    baseURL: 'http://localhost:1313',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: { executablePath } } }],
  webServer: sites.map(([content, port, flags]) => ({
    command: `node serve.js ${content} ${port} ${flags}`.trim(),
    url: `http://localhost:${port}/404.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  })),
});
