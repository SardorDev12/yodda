import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSingular, translatePlural } from '../i18n/translations.ts';

test('english and uzbek: only 1 is singular', () => {
  assert.ok(isSingular('en', 1));
  assert.ok(!isSingular('en', 0));
  assert.ok(!isSingular('uz', 21));
});

test('russian: 1, 21, 101 singular; 11 and 111 are not', () => {
  for (const n of [1, 21, 101]) assert.ok(isSingular('ru', n), String(n));
  for (const n of [0, 2, 11, 12, 111]) assert.ok(!isSingular('ru', n), String(n));
});

test('translatePlural picks the right string', () => {
  assert.equal(translatePlural('en', 'cardsDue', 1), '1 card due');
  assert.equal(translatePlural('en', 'cardsDue', 7), '7 cards due');
  assert.equal(translatePlural('ru', 'cards', 21), '21 карточка');
});
