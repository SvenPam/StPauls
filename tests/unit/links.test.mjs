import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addNoopener } from '../../config/links.js';

test('noopener is added once to new-tab links', () => {
  assert.equal(addNoopener('<a href="/a" target="_blank">a</a>'), '<a href="/a" target="_blank" rel="noopener">a</a>');
  assert.equal(addNoopener('<a href="/b" target="_blank" rel="nofollow">b</a>'), '<a href="/b" target="_blank" rel="nofollow noopener">b</a>');
  assert.equal(addNoopener('<a href="/c" target="_blank" rel="noopener">c</a>'), '<a href="/c" target="_blank" rel="noopener">c</a>');
  assert.equal(addNoopener('<a href="/d">d</a>'), '<a href="/d">d</a>');
});

test('legacy markup is matched whatever its case and quotes', () => {
  assert.equal(addNoopener("<A HREF='/e' TARGET='_blank'>e</A>"), "<A HREF='/e' TARGET='_blank' rel=\"noopener\">e</A>");
  assert.equal(addNoopener('<a target=_blank href="/f" REL="external">f</a>'), '<a target=_blank href="/f" REL="external noopener">f</a>');
  assert.equal(addNoopener('<a href="/g" target="_self">g</a><abbr target="_blank">x</abbr>'), '<a href="/g" target="_self">g</a><abbr target="_blank">x</abbr>');
});

test('a > inside an attribute value does not cut the tag short', () => {
  assert.equal(
    addNoopener('<a title="x > y" target="_blank" href="/a">a</a>'),
    '<a title="x > y" target="_blank" href="/a" rel="noopener">a</a>',
  );
});
