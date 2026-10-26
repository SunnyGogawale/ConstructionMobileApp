export const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");
export async function completePasswordReset(token, password) {
  if (!API_URL) throw new Error("VITE_API_URL is not configured.");
  const response = await fetch(`${API_URL}/api/auth/password-reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      token,
      password
    })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || `Password reset failed (HTTP ${response.status}).`);
  return result;
}
export async function apiRequest(path, token, options = {}) {
  if (!API_URL) throw new Error("VITE_API_URL is not configured.");
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body && !isFormData ? {
        "Content-Type": "application/json"
      } : {}),
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.message || `Request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return result;
}
