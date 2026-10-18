import { test } from 'node:test';
import assert from 'node:assert/strict';
import { embedFor } from '../../config/embeds.js';

const embeds = { 'google-calendar': { host: 'calendar.google.com', title: 'Church diary' }, 'facebook-album': { host: 'embedsocial.com', title: 'Photos' } };

test('a known embed on its own host', () => {
  assert.deepEqual(embedFor({ embed: 'google-calendar', embed_src: 'https://calendar.google.com/calendar/embed?src=x' }, embeds),
    { key: 'google-calendar', src: 'https://calendar.google.com/calendar/embed?src=x', title: 'Church diary' });
});

test('a protocol-relative address becomes https', () => {
  assert.equal(embedFor({ embed: 'facebook-album', embed_src: '//embedsocial.com/a/1' }, embeds).src, 'https://embedsocial.com/a/1');
});

test('another host, a look-alike host, http, javascript or an unknown type give nothing', () => {
  for (const [embed, embed_src] of [
    ['google-calendar', 'https://evil.example/calendar'],
    ['google-calendar', 'https://calendar.google.com.evil.example/x'],
    ['google-calendar', 'http://calendar.google.com/x'],
    ['facebook-album', 'javascript:alert(1)'],
    ['youtube', 'https://calendar.google.com/x'],
    ['google-calendar', ''],
  ]) assert.equal(embedFor({ embed, embed_src }, embeds), null, embed_src);
});
