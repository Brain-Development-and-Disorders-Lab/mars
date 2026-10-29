// Custom types
import { Collaborator, SpreadsheetFormat, UserGlobalPermissions } from "@types";

// Utility libraries and functions
import { nanoid } from "nanoid";
import Papa from "papaparse";
import XLSX from "xlsx";

/**
 * Generate safe pseudo-random identifiers for allocation when creating
 * new items for storage in the MongoDB database, in place of default
 * identifier
 * @param type identifier to be assigned an Entity, Attribute, Project, or Workspace
 * @return {string}
 */
export const getIdentifier = (
  type: "entity" | "attribute" | "activity" | "project" | "workspace" | "counter" | "identifier",
): string => {
  return `${type.slice(0, 1)}${nanoid(9)}`;
};

/**
 * Utility function to search a list of `Collaborator` objects and locate a specific
 * User identifier if it is present
 * @param {string} _id Identifier of User to search for
 * @param {Collaborator[]} collaborators Collection of `Collaborator` instances
 * @return `true` if located, `false` if not
 */
export const isCollaborator = (_id: string, collaborators: Collaborator[]): boolean => {
  for (const collaborator of collaborators) {
    if (collaborator._id === _id) {
      return true;
    }
  }
  return false;
};

/**
 * Utility function to parse a JSON-formatted or expected `UserGlobalPermissions` object
 * representing the user's global permissions.
 *
 * Note: Modifying outside of better-auth means that `permissions` is stored as a JSON string,
 * mirroring `api_keys`
 * @param {UserGlobalPermissions | string | null | undefined} permissions Either a JSON string or `UserGlobalPermissions` instance,
 * possibly not yet populated
 * @param {UserGlobalPermissions} fallback Value to use when `permissions` has not been populated yet
 * @return {UserGlobalPermissions}
 */
export const parseGlobalPermissions = (
  permissions: UserGlobalPermissions | string | null | undefined,
  fallback: UserGlobalPermissions,
): UserGlobalPermissions => {
  if (!permissions) return fallback;
  return typeof permissions === "string" ? JSON.parse(permissions) : permissions;
};

/**
 * Serialise rows of export data into a spreadsheet, the first row being the headers
 * @param {string[][]} rows Header row followed by data rows
 * @param {SpreadsheetFormat} format Spreadsheet format to generate
 * @return {string} CSV text, or a base64-encoded XLSX workbook
 */
export const toSpreadsheet = (rows: string[][], format: SpreadsheetFormat): string => {
  if (format === "xlsx") {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "Export");
    return (XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer).toString("base64");
  }
  return Papa.unparse(rows);
};
