import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const wf = parse(readFileSync('.github/workflows/deploy.yml', 'utf8'));
const dependabot = parse(readFileSync('.github/dependabot.yml', 'utf8'));

test('only the deploy job can request an Azure token', () => {
  assert.equal(wf.permissions['id-token'], undefined);
  for (const [name, job] of Object.entries(wf.jobs)) {
    assert.equal(job.permissions?.['id-token'] === 'write', name === 'deploy', name);
  }
});
test('the deploy job runs no npm code', () => {
  const runs = wf.jobs.deploy.steps.map((s) => s.run ?? '').join('\n');
  assert.doesNotMatch(runs, /\b(npm|npx|node)\b/);
  assert.ok(!wf.jobs.deploy.steps.some((s) => /setup-node/.test(s.uses ?? '')));
});
test('a deploy never waits on the audit', () => {
  assert.deepEqual([wf.jobs.deploy.needs].flat(), ['build']);
});
test('the audit fails only the weekly scheduled run', () => {
  assert.ok(wf.on.schedule.some((s) => s.cron === '41 4 * * 1'));
  assert.equal(wf.jobs.audit['continue-on-error'], "${{ github.event.schedule != '41 4 * * 1' }}");
  assert.ok(wf.jobs.audit.steps.some((s) => /^npm audit\b/.test(s.run ?? '')));
});
test('the deploy job keeps the OIDC subject', () => {
  assert.equal(wf.jobs.deploy.environment, undefined);
});
test('Dependabot updates npm and GitHub Actions', () => {
  assert.deepEqual(dependabot.updates.map((u) => u['package-ecosystem']).sort(), ['github-actions', 'npm']);
});
test('the top level can only read contents', () => {
  assert.deepEqual(wf.permissions, { contents: 'read' });
});
test('pushes watch everything the build reads', () => {
  for (const p of ['site/**', 'config/**', 'eleventy.config.js', 'package.json', 'package-lock.json', '.nvmrc', 'infra/**', '.pages.yml', 'tests/**', '.github/workflows/deploy.yml']) {
    assert.ok(wf.on.push.paths.includes(p), p);
  }
});
test('the deploy job publishes the built site folder', () => {
  const swa = wf.jobs.deploy.steps.find((s) => /static-web-apps-deploy/.test(s.uses ?? ''));
  assert.equal(swa.with.app_location, '_site');
});
test('Dependabot is monthly, grouped and limited to 5 PRs', () => {
  assert.equal(dependabot.version, 2);
  for (const u of dependabot.updates) {
    assert.equal(u.directory, '/');
    assert.equal(u.schedule.interval, 'monthly');
    assert.equal(u['open-pull-requests-limit'], 5);
    assert.equal(Object.keys(u.groups).length, 1);
  }
});
test('the weekly audit has its own concurrency group', () => {
  assert.equal(wf.concurrency['cancel-in-progress'], false);
  assert.equal(
    wf.concurrency.group,
    "${{ github.event.schedule == '41 4 * * 1' && 'audit' || 'deploy' }}-${{ github.ref }}",
  );
});
test('the build restores the image cache before it builds', () => {
  const steps = wf.jobs.build.steps;
  const cache = steps.findIndex((s) => /^actions\/cache@/.test(s.uses ?? ''));
  assert.ok(cache >= 0, 'no actions/cache step');
  assert.equal(steps[cache].with.path, '.cache/images');
  assert.match(steps[cache].with.key, /hashFiles\('package-lock\.json', 'config\/images\.js'\)/);
  assert.match(steps[cache].with['restore-keys'], /^images-/);
  assert.ok(cache < steps.findIndex((s) => s.run === 'npm run build'));
  assert.ok(!wf.jobs.deploy.steps.some((s) => /^actions\/cache@/.test(s.uses ?? '')));
});
