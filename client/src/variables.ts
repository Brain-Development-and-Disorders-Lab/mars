/**
 * Specify important application-wide variables
 */

// Custom types
import { UserGlobalPermissions, UserWorkspacePermissions } from "@types";

// Default Workspace permissions, mirrors server variables
export const DEFAULT_WORKSPACE_PERMISSIONS: UserWorkspacePermissions = {
  workspaces: {
    edit: false,
    invite: false,
  },
  entities: {
    create: false,
    edit: false,
    archive: false,
  },
  templates: {
    create: false,
    edit: false,
    archive: false,
  },
  projects: {
    create: false,
    edit: false,
    archive: false,
  },
};

// Default global permissions, mirrors server variables
export const DEFAULT_GLOBAL_PERMISSIONS: UserGlobalPermissions = {
  application: {
    import: false,
    scan: false,
    ai: false,
    api: false,
  },
  workspaces: {
    create: false,
    invite: false,
  },
};

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

// Accepted MIME types for attachments and imports
export const ACCEPTED_ATTACHMENTS = ["image/jpeg", "image/png", "application/pdf", "application/vnd.dna"];
export const ACCEPTED_IMPORTS_ENTITIES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/json",
];
export const ACCEPTED_IMPORTS_TEMPLATES = ["application/json"];

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
