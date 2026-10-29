// Custom types
import {
  Context,
  IEntity,
  UserWorkspacePermission,
  WorkspaceCollection,
  WorkspaceModel,
  WorkspaceRequirement,
} from "@types";

// Utility libraries and functions
import { GraphQLError } from "graphql";
import _ from "lodash";

// Models
import { Admin } from "@models/Admin";
import { Workspaces } from "@models/Workspaces";

/**
 * Create the `GraphQLError` thrown when an access check fails
 * @param {string} message Error message
 * @return {GraphQLError}
 */
export const unauthorized = (message: string): GraphQLError =>
  new GraphQLError(message, {
    extensions: {
      code: "UNAUTHORIZED",
    },
  });

/**
 * Verify the requesting User is an admin, throwing a `GraphQLError` otherwise
 * @param {Context} context Request context containing the User role
 */
export const assertAdmin = (context: Context): void => {
  if (context.userRole !== "admin") {
    throw unauthorized("You do not have permission to access this resource");
  }
};

/**
 * Verify the requesting User is the target User or an admin, throwing a `GraphQLError` otherwise
 * @param {Context} context Request context containing the User identifier and role
 * @param {string} target Identifier of the User being accessed
 */
export const assertSelfOrAdmin = (context: Context, target: string): void => {
  if (context.user !== target && context.userRole !== "admin") {
    throw unauthorized("You do not have permission to access this resource");
  }
};

/**
 * Verify the requesting user has the required access to the Workspace specified in the request context,
 * throwing a `GraphQLError` otherwise
 * @param {Context} context Request context containing user and Workspace identifiers
 * @param {WorkspaceRequirement} requirement `read` for queries, `member` for any member, or the specific permission required
 * @return {Promise<WorkspaceModel>} The Workspace, once access is verified
 */
export const assertWorkspaceAccess = async (
  context: Context,
  requirement: WorkspaceRequirement,
): Promise<WorkspaceModel> => {
  const workspace = context.workspace === "" ? null : await Workspaces.getOne(context.workspace);
  if (_.isNull(workspace) || !Workspaces.canAccess(context.user, workspace, requirement)) {
    throw unauthorized("You do not have permission to access this Workspace");
  }

  return workspace;
};

/**
 * Verify the requesting User holds a specific permission in an already retrieved Workspace,
 * throwing a `GraphQLError` otherwise
 * @param {Context} context Request context containing the user identifier
 * @param {WorkspaceModel} workspace Target Workspace
 * @param {UserWorkspacePermission} permission Permission required
 */
export const assertWorkspacePermission = (
  context: Context,
  workspace: WorkspaceModel,
  permission: UserWorkspacePermission,
): void => {
  if (!Workspaces.canAccess(context.user, workspace, permission)) {
    throw unauthorized("You do not have permission to make this change");
  }
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
    throw unauthorized("You do not have permission to access this content");
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

/**
 * Verify the requesting User holds every permission required by the changes in a Workspace update,
 * throwing a `GraphQLError` otherwise
 * @param {Context} context Request context containing the user identifier
 * @param {WorkspaceModel} current Workspace as currently stored
 * @param {WorkspaceModel} updated Workspace as submitted
 */
export const assertWorkspaceUpdatePermitted = (
  context: Context,
  current: WorkspaceModel,
  updated: WorkspaceModel,
): void => {
  const collaborators = updated.collaborators ?? [];

  // The owner always holds every permission, so cannot also be a collaborator
  if (collaborators.some((collaborator) => collaborator._id === current.owner)) {
    throw new GraphQLError("The Workspace owner cannot be added as a collaborator", {
      extensions: {
        code: "BAD_USER_INPUT",
      },
    });
  }

  // Inviting new collaborators
  if (_.differenceBy(collaborators, current.collaborators, "_id").length > 0) {
    assertWorkspacePermission(context, current, "administration.invite");
  }

  // Changing details, removing other collaborators, or granting permissions (any member may remove themselves to leave)
  const detailsChanged =
    updated.name !== current.name ||
    (updated.description ?? "") !== (current.description ?? "") ||
    !!updated.isPublic !== !!current.isPublic;
  const collaboratorsRemoved = _.differenceBy(current.collaborators, collaborators, "_id").some(
    (collaborator) => collaborator._id !== context.user,
  );
  const permissionsChanged = collaborators.some((collaborator) => {
    const existing = current.collaborators.find((c) => c._id === collaborator._id);
    return !_.isEqual(
      Admin.normalizeWorkspacePermissions(existing?.permissions),
      Admin.normalizeWorkspacePermissions(collaborator.permissions),
    );
  });
  if (detailsChanged || collaboratorsRemoved || permissionsChanged) {
    assertWorkspacePermission(context, current, "administration.edit");
  }
};
