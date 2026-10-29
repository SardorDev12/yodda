import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sm2Scheduler } from './scheduler.ts';
import { compareVersions, isVersionBelow } from './version.ts';

const now = new Date('2026-01-01T00:00:00Z');
const fresh = { intervalDays: 0, easeFactor: 2.5, repetitions: 0 };

test('again resets progress and lowers ease', () => {
  const r = sm2Scheduler.schedule({ intervalDays: 30, easeFactor: 2.5, repetitions: 5 }, 'again', now);
  assert.equal(r.repetitions, 0);
  assert.equal(r.intervalDays, 1);
  assert.equal(r.easeFactor, 2.3);
  assert.equal(r.status, 'learning');
});

test('ease is floored at 1.3', () => {
  const r = sm2Scheduler.schedule({ intervalDays: 1, easeFactor: 1.3, repetitions: 1 }, 'again', now);
  assert.equal(r.easeFactor, 1.3);
});

test('first and second repetition intervals', () => {
  assert.equal(sm2Scheduler.schedule(fresh, 'good', now).intervalDays, 1);
  assert.equal(sm2Scheduler.schedule(fresh, 'easy', now).intervalDays, 4);
  const second = { intervalDays: 1, easeFactor: 2.5, repetitions: 1 };
  assert.equal(sm2Scheduler.schedule(second, 'hard', now).intervalDays, 3);
  assert.equal(sm2Scheduler.schedule(second, 'good', now).intervalDays, 6);
  assert.equal(sm2Scheduler.schedule(second, 'easy', now).intervalDays, 9);
});

test('third repetition multiplies previous interval and can reach mature', () => {
  const r = sm2Scheduler.schedule({ intervalDays: 6, easeFactor: 2.5, repetitions: 2 }, 'good', now);
  assert.equal(r.intervalDays, 15);
  assert.equal(r.status, 'review');
  const m = sm2Scheduler.schedule({ intervalDays: 15, easeFactor: 2.5, repetitions: 3 }, 'good', now);
  assert.equal(m.status, 'mature');
});

test('version comparison is numeric per segment', () => {
  assert.equal(compareVersions('1.10.0', '1.9.0'), 1);
  assert.equal(compareVersions('1.0', '1.0.0'), 0);
  assert.ok(isVersionBelow('1.0.0', '1.0.1'));
});
