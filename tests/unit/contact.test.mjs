import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contactKey, enquiryTypes } from '../../config/contact.js';

const KEY = '0f9c7a52-1d2e-4c3b-9a8f-6b5e4d3c2b1a';

test('only a whole key turns the form on', () => {
  assert.equal(contactKey({ contact_access_key: KEY }), KEY);
  assert.equal(contactKey({ contact_access_key: KEY.toUpperCase() }), KEY.toUpperCase());
  for (const bad of ['', ` ${KEY}\n`, `${KEY}\n`, `<input value="${KEY}">`, KEY.slice(0, -1), undefined, null, 42])
    assert.equal(contactKey({ contact_access_key: bad }), '', JSON.stringify(bad));
  assert.equal(contactKey(undefined), '');
});

test('enquiry types fall back to one when empty', () => {
  assert.deepEqual(enquiryTypes({ enquiry_types: ['MU', ''] }), ['MU']);
  assert.deepEqual(enquiryTypes({ enquiry_types: ['', null] }), ['General Enquiry']);
  assert.deepEqual(enquiryTypes({ enquiry_types: [] }), ['General Enquiry']);
  assert.deepEqual(enquiryTypes({ enquiry_types: null }), ['General Enquiry']);
  assert.deepEqual(enquiryTypes({}), ['General Enquiry']);
});
