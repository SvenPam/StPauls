// Checks the custom role definitions the deploy identity is given (see the Azure how-to).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const load = (name) => JSON.parse(readFileSync(new URL(`../../infra/roles/${name}.json`, import.meta.url), 'utf8'));
const site = load('stpauls-static-web-app-deployer');
const template = load('stpauls-template-deployer');
const scope = ['/subscriptions/<SUB>/resourceGroups/<RG>'];

test('the site role grants exactly the four actions', () => {
  assert.deepEqual([...site.Actions].sort(), ['Microsoft.Web/staticSites/customDomains/*', 'Microsoft.Web/staticSites/listSecrets/action',
    'Microsoft.Web/staticSites/read', 'Microsoft.Web/staticSites/write']);
  assert.deepEqual(site.NotActions ?? [], []);
  assert.deepEqual(site.DataActions ?? [], []);
});

test('the template role grants deployments only', () => {
  assert.deepEqual(template.Actions, ['Microsoft.Resources/deployments/*']);
});

test('both roles are custom, scoped to the placeholder and hold no real ids', () => {
  for (const role of [site, template]) {
    assert.equal(role.IsCustom, true);
    assert.deepEqual(role.AssignableScopes, scope);
  }
  assert.equal(site.Name, 'StPauls Static Web App deployer');
  assert.equal(template.Name, 'StPauls template deployer');
});
