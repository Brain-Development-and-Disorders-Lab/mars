/**
 * Specify important application-wide variables
 */
// URL of the client application
export const APP_URL = process.env.NODE_ENV !== "production" ? "http://127.0.0.1:8080" : "https://app.metadatify.com";

// URL of the API server, either local or remote depending on deployment status
export const API_URL = process.env.NODE_ENV !== "production" ? "http://127.0.0.1:8000" : "https://api.metadatify.com";
export const STATIC_URL =
  process.env.NODE_ENV !== "production" ? "http://127.0.0.1:8000/static" : "https://api.metadatify.com/static";

// Key for the local storage data
export const STORAGE_KEY = "metadatify_storage";

// Default styling
export const GLOBAL_STYLES = {
  border: {
    style: "1px solid",
    color: "gray.300",
  },
  entity: {
    iconColor: "purple.500",
    defaultColor: "purple.400",
    lightColor: "purple.200",
  },
  project: {
    iconColor: "blue.500",
    defaultColor: "blue.400",
    lightColor: "blue.200",
  },
  template: {
    iconColor: "teal.500",
    defaultColor: "teal.400",
    lightColor: "teal.200",
  },
  dialog: {
    headerColor: "gray.200",
    footerColor: "gray.100",
  },
};
