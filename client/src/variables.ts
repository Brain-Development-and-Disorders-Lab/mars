/**
 * Specify important application-wide variables
 */
// Utility functions and libraries
import _ from "lodash";

// URL of the API server, either local or remote depending on deployment status
export const SERVER_URL = _.isEqual(process.env.NODE_ENV, "development") || _.isEqual(process.env.NODE_ENV, "test")
  ? "http://localhost:8000/mars"
  : "https://api.reusable.bio/mars";

// export const SERVER_URL = "http://localhost:8000/mars";

// Key of the local storage data containing the ORCiD token data and authentication data
export const TOKEN_KEY = "reusable_token";
