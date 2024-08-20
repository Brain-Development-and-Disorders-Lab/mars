import _ from "lodash";

// Authentication methods
import { Authentication } from "./models/Authentication";
import { nanoid } from "nanoid";

/**
 * Perform authentication operation. Authentication can only be bypassed in development mode.
 * @param {any} request Request for authentication
 * @param {any} response Response object
 * @param {function(): void} next Function to execute upon valid authentication
 */
export const authenticate = (request: any, response: any, next: () => void) => {
  // Bypass authentication in development mode
  if (_.isEqual(process.env.NODE_ENV, "development")) {
    request.user = { _id: "XXXX-1234-ABCD-0000" };
    // Bypass authentication in development mode
    next();
  } else {
    Authentication.validate(request.headers["token"])
      .then((result) => {
        if (result) {
          request.user = result;
          next();
        } else {
          response.status(403);
          response.json("Not authenticated");
        }
      })
      .catch((_error) => {
        response.status(403);
        response.json("Invalid token");
      });
  }
};

/**
 * Generate safe pseudo-random identifiers for allocation when creating
 * new items for storage in the MongoDB database, in place of default
 * identifier
 * @param type identifier to be assigned an Entity, Attribute, Project, or Workspace
 * @return {string}
 */
export const getIdentifier = (
  type: "entity" | "attribute" | "project" | "workspace",
): string => {
  return `${type.slice(0, 1)}${nanoid(7)}`;
};
