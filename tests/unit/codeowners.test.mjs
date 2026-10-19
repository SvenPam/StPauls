// CODEOWNERS must leave every path Pages CMS writes without an owner, so publishers' saves never wait on a review.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const rules = readFileSync('.github/CODEOWNERS', 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => {
    const [pattern, ...owners] = l.split(/\s+/);
    return { pattern, owners };
  });

const matches = (pattern, file) => {
  if (pattern === '*') return true;
  const p = pattern.replace(/^\//, '');
  return p.endsWith('/') ? file.startsWith(p) || `${file}/` === p : file === p;
};
// The last matching rule wins, as on GitHub.
const ownersOf = (file) => rules.filter((r) => matches(r.pattern, file)).at(-1)?.owners;

// Every `path` in the content tree, plus the media folder.
function pagesPaths() {
  const cfg = parse(readFileSync('.pages.yml', 'utf8'));
  const found = [cfg.media.input];
  const walk = (node) => {
    if (Array.isArray(node)) node.forEach(walk);
    else if (node && typeof node === 'object') {
      if (typeof node.path === 'string') found.push(node.path);
      Object.values(node).forEach(walk);
    }
  };
  walk(cfg.content);
  return found;
}

test('everything has the maintainer as owner', () => {
  assert.deepEqual(rules[0], { pattern: '*', owners: ['@SvenPam'] });
});
test('every path Pages CMS writes has no owner', () => {
  const owned = pagesPaths().filter((p) => ownersOf(p)?.length);
  assert.deepEqual(owned, []);
});
test('code paths still need the maintainer', () => {
  for (const file of ['config/swa.js', '.pages.yml', '.github/workflows/deploy.yml', 'site/_includes/base.njk', 'site/data/legacy.yaml']) {
    assert.deepEqual(ownersOf(file), ['@SvenPam'], file);
  }
});
