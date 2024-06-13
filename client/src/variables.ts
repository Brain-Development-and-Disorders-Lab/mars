/**
 * Specify important application-wide variables
 */
// Utility functions and libraries
import _ from "lodash";

// URL of the API server, either local or remote depending on deployment status
export const REST_URL =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:8000/mars"
    : "https://api.reusable.bio/mars";

export const GRAPHQL_URL =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:8001/graphql"
    : "https://api.reusable.bio/mars";

// Key of the local storage data containing the ORCiD token data and authentication data
export const TOKEN_KEY = "reusable_token";
