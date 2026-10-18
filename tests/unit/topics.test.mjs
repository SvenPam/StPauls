import { test } from 'node:test';
import assert from 'node:assert/strict';
import { topicOf } from '../../config/content.js';
import { topicPages, withTopic } from '../../config/topics.js';
import { newestFirst } from '../../config/filters.js';

test('topicOf reads the section field, takes the first of a list and lowercases', () => {
  assert.equal(topicOf('blog', { blogtopics: 'website' }), 'website');
  assert.equal(topicOf('calendar', { eventtopics: ['Church-Events', 'website'] }), 'church-events');
  assert.equal(topicOf('notices', { blogtopics: 'website' }), '');
  assert.equal(topicOf('', {}), '');
});

test('topicPages makes one page per section and topic', () => {
  const pages = topicPages({ website: 'Website', 'church-events': 'Church Events' });
  assert.equal(pages.length, 6);
  assert.deepEqual(pages[0], { section: 'blog', slug: 'website', label: 'Website' });
  assert.deepEqual(pages.at(-1), { section: 'notices', slug: 'church-events', label: 'Church Events' });
});

test('withTopic filters and newestFirst copies rather than reversing in place', () => {
  const items = [{ data: { topic: 'a' } }, { data: { topic: 'b' } }, { data: { topic: 'a' } }];
  assert.deepEqual(withTopic(items, 'a'), [items[0], items[2]]);
  const reversed = newestFirst(items);
  assert.deepEqual(reversed, [items[2], items[1], items[0]]);
  assert.equal(items[0].data.topic, 'a');
  assert.notEqual(reversed, items);
});
