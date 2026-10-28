// Custom types
import { Context, IEntity, WorkspaceAccess, WorkspaceCollection, WorkspaceModel } from "@types";

// Utility libraries and functions
import { GraphQLError } from "graphql";
import _ from "lodash";

// Models
import { Workspaces } from "@models/Workspaces";

/**
 * Verify the requesting user has the required access to the Workspace specified in the request context,
 * throwing a `GraphQLError` otherwise
 * @param {Context} context Request context containing user and Workspace identifiers
 * @param {WorkspaceAccess} access `read` for queries, `write` for anything that modifies data
 * @return {Promise<WorkspaceModel>} The Workspace, once access is verified
 */
export const assertWorkspaceAccess = async (context: Context, access: WorkspaceAccess): Promise<WorkspaceModel> => {
  const workspace = context.workspace === "" ? null : await Workspaces.getOne(context.workspace);
  if (_.isNull(workspace) || !Workspaces.canAccess(context.user, workspace, access)) {
    throw new GraphQLError("User does not have access to this Workspace", {
      extensions: {
        code: "UNAUTHORIZED",
      },
    });
  }

  return workspace;
};

/**
 * Verify that every identifier belongs to the given collection of the Workspace, throwing a `GraphQLError` otherwise
 * @param {WorkspaceModel} workspace Workspace that must contain the identifiers
 * @param {WorkspaceCollection} collection Collection to check, such as `entities` or `projects`
 * @param {string[]} identifiers Identifiers to check
 */
export const assertInWorkspace = (
  workspace: WorkspaceModel,
  collection: WorkspaceCollection,
  identifiers: string[],
): void => {
  if (_.difference(identifiers, workspace[collection]).length > 0) {
    throw new GraphQLError("You do not have permission to access this content", {
      extensions: {
        code: "UNAUTHORIZED",
      },
    });
  }
};

/**
 * Verify that the Projects and linked Entities referenced by an Entity belong to the Workspace
 * @param {WorkspaceModel} workspace Workspace that must contain the references
 * @param {Partial<IEntity>} entity Entity data containing the references
 */
export const assertEntityReferencesInWorkspace = (workspace: WorkspaceModel, entity: Partial<IEntity>): void => {
  assertInWorkspace(workspace, "projects", entity.projects ?? []);
  assertInWorkspace(
    workspace,
    "entities",
    (entity.links ?? []).map((link) => link.target._id),
  );
};
