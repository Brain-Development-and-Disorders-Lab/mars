// Custom types
import { Collaborator, UserGlobalPermissions } from "@types";

// Utility libraries and functions
import { nanoid } from "nanoid";

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
