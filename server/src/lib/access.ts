// Custom types
import { Context } from "@types";

// Utility libraries and functions
import { GraphQLError } from "graphql";

// Models
import { Workspaces } from "@models/Workspaces";

/**
 * Verify the requesting user has access to the Workspace specified in the request context,
 * throwing a GraphQLError otherwise
 * @param {Context} context Request context containing user and Workspace identifiers
 * @return {Promise<void>}
 */
export const assertWorkspaceAccess = async (context: Context): Promise<void> => {
  const hasAccess = await Workspaces.checkAccess(context.user, context.workspace);
  if (!hasAccess) {
    throw new GraphQLError("User does not have access to this Workspace", {
      extensions: {
        code: "UNAUTHORIZED",
      },
    });
  }
};
