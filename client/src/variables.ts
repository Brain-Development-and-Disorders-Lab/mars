/**
 * Specify important application-wide variables
 */

// Custom types
import { UserGlobalPermissions, UserWorkspacePermissions } from "@types";

// Default Workspace permissions, mirrors server variables
export const DEFAULT_WORKSPACE_PERMISSIONS: UserWorkspacePermissions = {
  administration: {
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
  features: {
    import: true,
    scan: true,
    ai: false,
    api: false,
  },
  workspaces: {
    create: false,
  },
};

// URL of the client application
export const APP_URL = import.meta.env.PROD ? "https://app.metadatify.com" : "http://127.0.0.1:8080";

// URL of the API server, either local or remote depending on deployment status
export const API_URL = import.meta.env.PROD ? "https://api.metadatify.com" : "http://127.0.0.1:8000";
export const STATIC_URL = import.meta.env.PROD ? "https://api.metadatify.com/static" : "http://127.0.0.1:8000/static";

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

// Default styling, canonical design tokens
export { STYLES } from "./styles/styles";
