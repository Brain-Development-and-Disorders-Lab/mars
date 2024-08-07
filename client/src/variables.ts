/**
 * Specify important application-wide variables
 */
// Utility functions and libraries
import _ from "lodash";

// URL of the API server, either local or remote depending on deployment status
export const API_URL =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:8000"
    : "https://api.storacuity.com";
export const STATIC_URL =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:8000/static"
    : "https://api.storacuity.com/static";

// Key of the local storage data containing the ORCiD token data and authentication data
export const TOKEN_KEY = "storacuity_token";
