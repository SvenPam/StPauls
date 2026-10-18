// Checks that every path in a list resolves, against a local build or a deployed host. Hand-run, never in CI.
//   node scripts/check-urls.mjs --list tests/fixtures/live-urls.txt --built _site
//   node scripts/check-urls.mjs --list tests/fixtures/live-urls.txt --base https://<host> [--config _site/staticwebapp.config.json]
//   node scripts/check-urls.mjs --list tests/fixtures/live-urls.txt --base https://www.<domain> --redirects-to https://<domain>
// Behind the sandbox proxy, run with NODE_USE_ENV_PROXY=1.
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

// One path per line. Lines starting with # and blank lines are skipped.
export function loadList(file) {
  return readFileSync(file, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

// Static Web Apps matching: exact, or by the prefix before a trailing *. Case-sensitive.
export function matchRoute(route, p) {
  return route.endsWith('*') ? p.startsWith(route.slice(0, -1)) : route === p;
}

const readConfig = (file) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { routes: [] });

const isFile = (file) => existsSync(file) && statSync(file).isFile();

const decode = (p) => {
  try {
    return decodeURIComponent(p);
  } catch {
    return p;
  }
};

// Failures for paths with no built page or file and no route in the built config.
export async function checkBuilt(paths, built) {
  const { routes = [] } = readConfig(path.join(built, 'staticwebapp.config.json'));
  return paths
    .filter((p) => {
      const file = path.join(built, decode(p));
      if (isFile(path.join(file, 'index.html')) || isFile(file)) return false;
      return !routes.some((r) => matchRoute(r.route, decode(p)));
    })
    .map((p) => `${p}: not built`);
}

const sameUrl = (a, b, base) => new URL(a, base).href === new URL(b, base).href;

// Failures for paths a host does not serve as expected. Redirects are not followed.
// Without redirectsTo: 200 passes, and 301 or 302 passes only to the target of a matching redirect route in
// config, or to the same path without its trailing slash. With redirectsTo: every path must 301 to that host.
export async function checkHost(paths, base, { config = { routes: [] }, fetch = globalThis.fetch, redirectsTo } = {}) {
  const redirects = (config.routes ?? []).filter((r) => r.redirect);
  const failures = [];
  for (const p of paths) {
    let res;
    try {
      res = await fetch(new URL(p, base).href, { redirect: 'manual' });
    } catch (err) {
      failures.push(`${p}: ${err.cause?.message ?? err.message}`);
      continue;
    }
    const location = res.headers.get('location');
    const moved = `${p}: ${res.status} to ${location}`;
    if (redirectsTo) {
      if (res.status !== 301) failures.push(location ? moved : `${p}: ${res.status}`);
      else if (location !== `${redirectsTo}${p}`) failures.push(moved);
      continue;
    }
    if (res.status === 200) continue;
    if ((res.status === 301 || res.status === 302) && location) {
      const route = redirects.find((r) => matchRoute(r.route, decode(p)));
      const slashless = p.length > 1 && p.endsWith('/') ? p.replace(/\/+$/, '') : null;
      if (route && sameUrl(location, route.redirect, base)) continue;
      if (slashless && sameUrl(location, slashless, base)) continue;
      failures.push(moved);
      continue;
    }
    failures.push(location ? moved : `${p}: ${res.status}`);
  }
  return failures;
}

export async function main(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      list: { type: 'string' },
      built: { type: 'string' },
      base: { type: 'string' },
      config: { type: 'string', default: '_site/staticwebapp.config.json' },
      'redirects-to': { type: 'string' },
    },
  });
  if (!values.list || !values.built === !values.base) {
    console.error('Usage: check-urls.mjs --list <file> (--built <dir> | --base <url> [--config <file>] [--redirects-to <url>])');
    return 2;
  }
  const paths = loadList(values.list);
  let failures;
  if (values.built) {
    failures = await checkBuilt(paths, values.built);
  } else if (values['redirects-to']) {
    failures = await checkHost(paths, values.base, { redirectsTo: values['redirects-to'].replace(/\/+$/, '') });
  } else {
    if (!existsSync(values.config)) {
      console.error(`${values.config} not found. Run npm run build first.`);
      return 2;
    }
    failures = await checkHost(paths, values.base, { config: readConfig(values.config) });
  }
  for (const line of failures) console.log(line);
  console.log(`${paths.length} checked, ${failures.length} failed`);
  return failures.length ? 1 : 0;
}

if (import.meta.main) process.exitCode = await main(process.argv.slice(2));
