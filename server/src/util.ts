import { nanoid } from "nanoid";

/**
 * Generate safe pseudo-random identifiers for allocation when creating
 * new items for storage in the MongoDB database, in place of default
 * identifier
 * @param type identifier to be assigned an Entity, Attribute, Project, or Workspace
 * @return {string}
 */
export const getIdentifier = (
  type: "entity" | "template" | "activity" | "project" | "workspace",
): string => {
  return `${type.slice(0, 1)}${nanoid(9)}`;
};
