export const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");
export async function apiRequest(path, body, token, method = "POST") {
  if (!API_URL) throw new Error("The project API is not configured. Nothing has been submitted.");
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body ? {
        "Content-Type": "application/json"
      } : {}),
      ...(token ? {
        Authorization: `Bearer ${token}`
      } : {})
    },
    ...(body ? {
      body: JSON.stringify(body)
    } : {})
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || `Request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return payload;
}
