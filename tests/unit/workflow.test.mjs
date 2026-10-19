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

test('every action is pinned to a commit with its version', () => {
  const text = readFileSync('.github/workflows/deploy.yml', 'utf8');
  const uses = [...text.matchAll(/^\s+(?:- )?uses: (\S+)(.*)$/gm)];
  assert.ok(uses.length > 0);
  for (const [, ref, rest] of uses) {
    assert.match(ref, /^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/, ref);
    assert.match(rest, /^\s+# v\d+(\.\d+)*$/, ref);
  }
});

// infra-changed.sh decides whether the deploy job runs Bicep. Run it in a throwaway repo.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const script = path.resolve('.github/scripts/infra-changed.sh');
const repo = mkdtempSync(path.join(tmpdir(), 'infra-'));
const git = (...args) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: repo, encoding: 'utf8' }).trim();
const commit = (file, text) => {
  mkdirSync(path.dirname(path.join(repo, file)), { recursive: true });
  writeFileSync(path.join(repo, file), text);
  git('add', '-A');
  git('commit', '-qm', file);
  return git('rev-parse', 'HEAD');
};
git('init', '-q');
const A = commit('infra/main.bicep', 'a');
const B = commit('site/a.md', 'b');
const C = commit('infra/main.bicep', 'c');
const decide = (event, before, head) => execFileSync('bash', [script, event, before, head], { cwd: repo, encoding: 'utf8' }).trim();

test('infra-changed: content-only push skips Bicep', () => {
  assert.equal(decide('push', A, B), 'infra=false');
});
test('infra-changed: infra push runs Bicep', () => {
  assert.equal(decide('push', B, C), 'infra=true');
  assert.equal(decide('push', A, C), 'infra=true');
});
test('infra-changed: unknown before runs Bicep', () => {
  for (const before of ['0000000000000000000000000000000000000000', '', 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef']) {
    assert.equal(decide('push', before, C), 'infra=true', before);
  }
});
test('infra-changed: manual runs Bicep, schedule never', () => {
  assert.equal(decide('workflow_dispatch', A, B), 'infra=true');
  assert.equal(decide('schedule', B, C), 'infra=false');
});
test('the deploy job runs Bicep only when infra changed', () => {
  const steps = wf.jobs.deploy.steps;
  const byId = (id) => steps.find((s) => s.id === id);
  assert.match(byId('changes').run, /\.github\/scripts\/infra-changed\.sh/);
  assert.equal(byId('infra').if, "steps.changes.outputs.infra == 'true'");
  assert.equal(byId('last').if, "steps.changes.outputs.infra != 'true'");
  assert.match(byId('last').run, /az deployment group show/);
  assert.match(byId('last').run, /--name stpauls-web/);
  assert.equal(byId('token').env.NAME, '${{ steps.infra.outputs.name || steps.last.outputs.name }}');
  assert.equal(steps.find((s) => /actions\/checkout/.test(s.uses ?? '')).with['fetch-depth'], 0);
});
