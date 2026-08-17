import API_BASE_URL from '../constants/api';

async function apiRequest(endpoint, options = {}) {
  const {token, ...rest} = options;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? {Authorization: `Bearer ${token}`} : {}),
    ...rest.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers,
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || `Request failed: ${response.status}`);
  }

  return payload;
}

export const get = (endpoint, options) =>
  apiRequest(endpoint, {method: 'GET', ...options});

export const post = (endpoint, body, options) =>
  apiRequest(endpoint, {method: 'POST', body: JSON.stringify(body), ...options});

export const put = (endpoint, body, options) =>
  apiRequest(endpoint, {method: 'PUT', body: JSON.stringify(body), ...options});

export const patch = (endpoint, body, options) =>
  apiRequest(endpoint, {method: 'PATCH', body: JSON.stringify(body), ...options});

export const del = (endpoint, options) =>
  apiRequest(endpoint, {method: 'DELETE', ...options});

export default apiRequest;
