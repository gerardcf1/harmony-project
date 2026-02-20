const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export async function api(path: string, options?: RequestInit) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    cache: 'no-store',
  });
}

export const getApiBaseUrl = () => API_URL;

export function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getSession() {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  return token ? { token, role } : null;
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
}
