import { test as base, createBdd } from 'playwright-bdd';

// `ui.page` is the page under test. "Given scripts are off" swaps it for one without JavaScript.
export const test = base.extend({
  ui: async ({ page }, use) => {
    await use({ page });
  },
});

export const { Given, When, Then } = createBdd(test);

export const EMPTY_SITE = 'http://localhost:1314';
export const KEYED_SITE = 'http://localhost:1315';
// Built with NOW set to CLOCK_NOW (tests/playwright.config.js).
export const CLOCK_SITE = 'http://localhost:1316';
export const CLOCK_NOW = '2030-06-15T12:00:00+01:00';
