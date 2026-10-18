// DATA layers a fixture folder over site/data. The folder is read at import, so each case runs in a child process.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const readData = (DATA) => JSON.parse(execFileSync('node', ['-e', "import('./config/data.js').then((m) => console.log(JSON.stringify(m.readData())))"],
  { env: { ...process.env, DATA } }));

test('fixture files win, the rest still come from site/data', () => {
  const data = readData('tests/fixtures/data/with-key');
  assert.equal(data.settings.facebook_url, 'https://www.facebook.com/fixture');
  assert.equal(data.site.title, "St Paul's Warton");
  assert.ok(data.topics.website);
});

test('without DATA every file comes from site/data', () => {
  const data = readData('');
  assert.equal(data.settings.contact_subject, 'Website enquiry');
  assert.ok(data.topics.website);
});
