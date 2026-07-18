// Central configuration for the frontend.
// All API calls should import API_BASE_URL from here instead of hardcoding URLs.

// In production with a reverse proxy (same origin), leave REACT_APP_API_URL empty
// so that relative paths are used.
export const API_BASE_URL = process.env.REACT_APP_API_URL || '';
