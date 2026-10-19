// The hand-run URL check, against a temporary build and a fake fetch. It never runs against a real host here.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { checkBuilt, checkHost, loadList, matchRoute, main } from '../../scripts/check-urls.mjs';

let built;
const config = {
  trailingSlash: 'never',
  routes: [
    { route: '/Calendar', redirect: '/calendar', statusCode: 301 },
    { route: '/account*', redirect: 'https://app.pagescms.org/svenpam/stpauls/main', statusCode: 302 },
  ],
};

before(async () => {
  built = await mkdtemp(path.join(tmpdir(), 'check-urls-'));
  await mkdir(path.join(built, 'notices/notice/newer'), { recursive: true });
  await mkdir(path.join(built, 'uploads'), { recursive: true });
  await writeFile(path.join(built, 'index.html'), '');
  await writeFile(path.join(built, 'notices/notice/newer/index.html'), '');
  await writeFile(path.join(built, 'uploads/My Poster.pdf'), '');
  await writeFile(path.join(built, 'staticwebapp.config.json'), JSON.stringify(config));
});

after(async () => {
  await rm(built, { recursive: true, force: true });
});

const fakeFetch = (answers) => async (url) => {
  const [status, location] = answers[new URL(url).pathname] ?? [404];
  return { status, headers: new Headers(location ? { location } : {}) };
};

test('a build passes for its pages and its routes', async () => {
  assert.deepEqual(await checkBuilt(['/', '/notices/notice/newer', '/Calendar', '/account/login'], built), []);
});

test('a built file passes, with its path decoded', async () => {
  assert.deepEqual(await checkBuilt(['/uploads/My%20Poster.pdf'], built), []);
});

test('a missing page is reported', async () => {
  assert.deepEqual(await checkBuilt(['/nope'], built), ['/nope: not built']);
});

test('routes match case-sensitively', () => {
  assert.equal(matchRoute('/Calendar', '/calendar'), false);
  assert.equal(matchRoute('/Calendar', '/Calendar'), true);
  assert.equal(matchRoute('/account*', '/account/manage'), true);
  assert.equal(matchRoute('/account*', '/Account/Login'), false);
});

test('a page answering 200 passes', async () => {
  const fetch = fakeFetch({ '/blog': [200] });
  assert.deepEqual(await checkHost(['/blog'], 'https://h', { config, fetch }), []);
});

test('a missing page fails with its status', async () => {
  assert.deepEqual(await checkHost(['/nope'], 'https://h', { config, fetch: fakeFetch({}) }), ['/nope: 404']);
});

test('an unexpected redirect fails', async () => {
  const fetch = fakeFetch({ '/blog': [301, '/elsewhere'] });
  assert.deepEqual(await checkHost(['/blog'], 'https://h', { config, fetch }), ['/blog: 301 to /elsewhere']);
});

test('a configured redirect to the wrong place fails', async () => {
  const fetch = fakeFetch({ '/Calendar': [301, '/notices'] });
  assert.deepEqual(await checkHost(['/Calendar'], 'https://h', { config, fetch }), ['/Calendar: 301 to /notices']);
});

test('a configured redirect to its target passes', async () => {
  const fetch = fakeFetch({ '/account/login': [302, 'https://app.pagescms.org/svenpam/stpauls/main'], '/Calendar': [301, 'https://h/calendar'] });
  assert.deepEqual(await checkHost(['/account/login', '/Calendar'], 'https://h', { config, fetch }), []);
});

test('a trailing slash redirected to the same path without it passes', async () => {
  const fetch = fakeFetch({ '/notices/': [301, '/notices'] });
  assert.deepEqual(await checkHost(['/notices/'], 'https://h', { config, fetch }), []);
});

test('a request that cannot be made fails with the reason', async () => {
  const fetch = async () => {
    throw new Error('getaddrinfo ENOTFOUND h');
  };
  assert.deepEqual(await checkHost(['/blog'], 'https://h', { config, fetch }), ['/blog: getaddrinfo ENOTFOUND h']);
});

test('redirectsTo expects every path on the other host', async () => {
  const fetch = fakeFetch({ '/blog': [301, 'https://bare/blog'], '/notices': [301, 'https://bare/'] });
  assert.deepEqual(await checkHost(['/blog', '/notices'], 'https://www', { fetch, redirectsTo: 'https://bare' }), ['/notices: 301 to https://bare/']);
});

test('the list ignores comments and blank lines', async () => {
  const file = path.join(built, 'list.txt');
  await writeFile(file, '# x\n\n/a\n  \n');
  assert.deepEqual(loadList(file), ['/a']);
});

test('main prints failures and a summary, and exits 1 when any failed', async () => {
  const file = path.join(built, 'two.txt');
  await writeFile(file, '/\n/nope\n');
  const lines = [];
  const log = console.log;
  console.log = (line) => lines.push(line);
  try {
    assert.equal(await main(['--list', file, '--built', built]), 1);
  } finally {
    console.log = log;
  }
  assert.deepEqual(lines, ['/nope: not built', '2 checked, 1 failed']);
});

test('main exits 0 when everything passed', async () => {
  const file = path.join(built, 'one.txt');
  await writeFile(file, '/\n');
  const log = console.log;
  console.log = () => {};
  try {
    assert.equal(await main(['--list', file, '--built', built]), 0);
  } finally {
    console.log = log;
  }
});

test('the live list is sorted, unique and has no trailing slashes', () => {
  const paths = loadList('tests/fixtures/live-urls.txt');
  assert.ok(paths.length > 100);
  assert.equal(new Set(paths).size, paths.length);
  assert.ok(paths.every((p) => p === '/' || !p.endsWith('/')));
});
