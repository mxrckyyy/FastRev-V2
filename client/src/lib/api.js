// Shared API client foundation. Extended in later phases.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, headers = {}, token } = options;
  const requestHeaders = { 'Content-Type': 'application/json', ...headers };
  if (token) requestHeaders.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const error = new Error(data?.error?.message || data?.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export { BASE_URL };