// Central configuration for the frontend.
// All API calls should import API_BASE_URL from here instead of hardcoding URLs.

const configuredApiBaseUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.REACT_APP_API_URL ||
  '';

// In production with a reverse proxy (same origin), leave the API URL empty
// so that relative paths are used.
export const API_BASE_URL = configuredApiBaseUrl.replace(/\/$/, '');
