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
    create: true,
  },
};

// Predefined Secondary Identifier formats, always present in the Select
export const BASE_IDENTIFIER_FORMATS = [{ label: "GUID: NIH NIAA", value: "guid_nih_niaa", category: "Base" }];

// URL of the client application
export const APP_URL = import.meta.env.PROD ? "https://app.metadatify.com" : "http://127.0.0.1:8080";

// URL of the API server, either local or remote depending on deployment status
export const API_URL = import.meta.env.PROD ? "https://api.metadatify.com" : "http://127.0.0.1:8000";
export const STATIC_URL = import.meta.env.PROD ? "https://api.metadatify.com/static" : "http://127.0.0.1:8000/static";

// Key for the local storage data
export const STORAGE_KEY = "metadatify_storage";

// MIME types
export const JSON_MIME_TYPE = "application/json";
export const CSV_MIME_TYPE = "text/csv";
export const XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// Accepted MIME types for attachments and imports
export const ACCEPTED_ATTACHMENTS = ["image/jpeg", "image/png", "application/pdf", "application/vnd.dna"];
export const ACCEPTED_IMPORTS_ENTITIES = [XLSX_MIME_TYPE, CSV_MIME_TYPE, JSON_MIME_TYPE];
export const ACCEPTED_IMPORTS_TEMPLATES = ["application/json"];

// Number of displayed columns on spreadsheet imports
export const MAX_DISPLAYED_COLUMNS = 10;

// Default styling, canonical design tokens
export { STYLES } from "./styles/styles";
