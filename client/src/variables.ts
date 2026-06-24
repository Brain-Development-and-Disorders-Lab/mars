/**
 * Specify important application-wide variables
 */
// URL of the client application
export const APP_URL =
  import.meta.env.NODE_ENV !== "production" ? "http://127.0.0.1:8080" : "https://app.metadatify.com";

// URL of the API server, either local or remote depending on deployment status
export const API_URL =
  import.meta.env.NODE_ENV !== "production" ? "http://127.0.0.1:8000" : "https://api.metadatify.com";
export const STATIC_URL =
  import.meta.env.NODE_ENV !== "production" ? "http://127.0.0.1:8000/static" : "https://api.metadatify.com/static";

// Key for the local storage data
export const STORAGE_KEY = "metadatify_storage";

// Default styling
export const GLOBAL_STYLES = {
  font: {
    secondaryHeader: {
      color: "gray.600",
    },
  },
  border: {
    style: "1px solid",
    color: "gray.300",
  },
  card: {
    bg: "gray.50",
  },
  dialog: {
    header: {
      bg: "gray.200",
    },
    footer: {
      bg: "gray.100",
    },
  },
  entity: {
    color: {
      default: "purple.400",
      light: "purple.200",
      icon: "purple.500",
    },
  },
  project: {
    color: {
      default: "blue.400",
      light: "blue.200",
      icon: "blue.500",
    },
  },
  template: {
    color: {
      default: "teal.400",
      light: "teal.200",
      icon: "teal.500",
    },
  },
};
