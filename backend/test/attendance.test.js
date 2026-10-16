import test from 'node:test';
import assert from 'node:assert/strict';
import { breakEndAt, dayKeyAt, MAX_BREAK_SECONDS, verifyGeofence, verifyLocationAccuracy } from '../src/domain/attendance.js';

test('allows a GPS fix inside the configured site radius', () => {
  const result = verifyGeofence(
    { latitude: 37.7895, longitude: -122.4012 },
    { latitude: 37.7899, longitude: -122.4012, radiusMetres: 100 },
  );
  assert.equal(result.allowed, true);
  assert.ok(result.distance < 100);
});

test('blocks a GPS fix outside the configured site radius', () => {
  const result = verifyGeofence(
    { latitude: 37.7895, longitude: -122.4012 },
    { latitude: 37.792, longitude: -122.4012, radiusMetres: 100 },
  );
  assert.equal(result.allowed, false);
  assert.ok(result.distance > 100);
});

test('requires GPS accuracy no worse than the configured site radius', () => {
  assert.equal(verifyLocationAccuracy(40, 100).allowed, true);
  assert.equal(verifyLocationAccuracy(101, 100).allowed, false);
  assert.equal(verifyLocationAccuracy(0, 100).allowed, false);
});

test('uses the project time zone to determine the attendance day', () => {
  assert.equal(dayKeyAt(new Date('2026-10-16T02:00:00.000Z'), 'America/Los_Angeles'), '2026-10-15');
});

test('caps an overlong break at the one-hour server limit', () => {
  const startedAt = new Date('2026-10-16T08:00:00.000Z');
  const endedAt = breakEndAt(startedAt, new Date('2026-10-16T10:00:00.000Z'));
  assert.equal(endedAt.toISOString(), '2026-10-16T09:00:00.000Z');
  assert.equal(MAX_BREAK_SECONDS, 3600);
});