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
