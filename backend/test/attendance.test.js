import test from 'node:test';
import assert from 'node:assert/strict';
import { breakEndAt, dayKeyAt, MAX_BREAK_SECONDS, verifyGeofence, verifyLocationAccuracy, verifySiteLocation } from '../src/domain/attendance.js';
import { isUploadedImage, uploadedImageFilename } from '../src/domain/uploadedImage.js';

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

test('accepts a valid on-site location fix for attendance verification', () => {
  const result = verifySiteLocation({
    latitude: 37.7895,
    longitude: -122.4012,
    accuracy: 20,
  }, {
    location: { latitude: 37.7899, longitude: -122.4012, radiusMetres: 100 },
  });
  assert.equal(result.allowed, true);
});

test('rejects out-of-radius and low-accuracy attendance fixes', () => {
  const project = { location: { latitude: 37.7899, longitude: -122.4012, radiusMetres: 100 } };
  assert.throws(() => verifySiteLocation({
    latitude: 37.792,
    longitude: -122.4012,
    accuracy: 20,
  }, project), { status: 403 });
  assert.throws(() => verifySiteLocation({
    latitude: 37.7895,
    longitude: -122.4012,
    accuracy: 120,
  }, project), { status: 422 });
});

test('accepts selfie references for stored uploads across API proxy origins', () => {
  const origin = 'https://api.example.test';
  const uuid = '123e4567-e89b-12d3-a456-426614174000';
  assert.equal(uploadedImageFilename(`${origin}/uploads/${uuid}.jpg`), `${uuid}.jpg`);
  assert.equal(uploadedImageFilename(`${origin}/uploads/Check-In/Skyline-Tower-Rahul-Sharma-20261025_093015.jpg`), 'Check-In/Skyline-Tower-Rahul-Sharma-20261025_093015.jpg');
  assert.equal(uploadedImageFilename(`${origin}/uploads/Daily-Attendance/Rahul-Sharma-20261025_130000-a1b2c3d4.jpeg`), 'Daily-Attendance/Rahul-Sharma-20261025_130000-a1b2c3d4.jpeg');
  assert.equal(uploadedImageFilename(`https://storage.example.test/uploads/${uuid}.jpg`), `${uuid}.jpg`);
  assert.equal(uploadedImageFilename(`${origin}/uploads/Install-Framing-Alex-Worker-2026-10-25T10-13-42-690Z/${uuid}.jpg`), `Install-Framing-Alex-Worker-2026-10-25T10-13-42-690Z/${uuid}.jpg`);
  assert.equal(uploadedImageFilename(`${origin}/uploads/../../secret.jpg`), null);
  assert.equal(uploadedImageFilename(`${origin}/uploads/${uuid}.jpg?download=1`), null);
  assert.equal(uploadedImageFilename(`data:image/jpeg;base64,${uuid}`), null);
});

test('rejects uploaded image references that do not exist on the server', async () => {
  assert.equal(await isUploadedImage(
    'https://api.example.test/uploads/123e4567-e89b-12d3-a456-426614174000.jpg',
  ), false);
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