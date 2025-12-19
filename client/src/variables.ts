/**
 * Specify important application-wide variables
 */
// URL of the API server, either local or remote depending on deployment status
export const API_URL =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:8000"
    : "https://api.metadatify.com";
export const STATIC_URL =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:8000/static"
    : "https://api.metadatify.com/static";

// Key for the local storage data
export const STORAGE_KEY = "metadatify_storage";
