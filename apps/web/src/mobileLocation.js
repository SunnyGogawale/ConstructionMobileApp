export const Accuracy = { High: 6 };

export async function requestForegroundPermissionsAsync() {
  if (!navigator.geolocation) {
    return { granted: false, status: "denied", canAskAgain: false };
  }
  if (!navigator.permissions?.query) {
    return { granted: true, status: "granted", canAskAgain: true };
  }
  try {
    const permission = await navigator.permissions.query({ name: "geolocation" });
    return {
      granted: permission.state !== "denied",
      status: permission.state === "prompt" ? "undetermined" : permission.state,
      canAskAgain: permission.state !== "denied",
    };
  } catch {
    return { granted: true, status: "undetermined", canAskAgain: true };
  }
}

export function getCurrentPositionAsync({ maximumAge = 0, timeout = 15000 } = {}) {
  if (!navigator.geolocation) {
    return Promise.reject(new Error("This browser does not support location services."));
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      position => resolve({
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
        },
        timestamp: position.timestamp,
      }),
      error => reject(new Error(error.message || "Unable to get your location.")),
      { enableHighAccuracy: true, maximumAge, timeout },
    );
  });
}
