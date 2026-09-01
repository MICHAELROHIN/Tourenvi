/**
 * Central API Base URL configuration.
 * - In local development: defaults to "http://localhost:8000"
 * - In production: defaults to "" (same-origin relative paths) if VITE_API_URL is not set
 * - Custom backend (e.g. Render): set VITE_API_URL=https://your-backend.onrender.com
 */
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:8000" : "")
).replace(/\/$/, "");

export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};
