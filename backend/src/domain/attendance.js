const EARTH_RADIUS_METRES = 6371000;
export const MAX_BREAK_SECONDS = 60 * 60;

export function distanceMetres(origin, destination) {
  const radians = degrees => degrees * Math.PI / 180;
  const latitudeDelta = radians(destination.latitude - origin.latitude);
  const longitudeDelta = radians(destination.longitude - origin.longitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(origin.latitude)) * Math.cos(radians(destination.latitude))
    * Math.sin(longitudeDelta / 2) ** 2;
  return Math.round(EARTH_RADIUS_METRES * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)));
}

export function verifyGeofence({ latitude, longitude }, site) {
  const distance = distanceMetres({ latitude, longitude }, site);
  return { distance, allowed: distance <= site.radiusMetres };
}

export function verifyLocationAccuracy(accuracyMetres, radiusMetres) {
  return {
    accuracyMetres,
    allowed: Number.isFinite(accuracyMetres) && accuracyMetres > 0 && accuracyMetres <= radiusMetres,
  };
}

export function dayKeyAt(date, timeZone = 'UTC') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const fields = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${fields.year}-${fields.month}-${fields.day}`;
}

export function breakEndAt(startedAt, now = new Date()) {
  const maximumEnd = new Date(startedAt.getTime() + MAX_BREAK_SECONDS * 1000);
  return now < maximumEnd ? now : maximumEnd;
}
