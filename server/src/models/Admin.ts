// Custom types
import {
  AdminMetrics,
  AdminUser,
  AdminWorkspace,
  Collaborator,
  IResponseMessage,
  UserCollatedPermissions,
  UserGlobalPermissions,
  UserModel,
  UserWorkspacePermissions,
  WorkspaceModel,
} from "@types";

// Models
import { User } from "./User";

// Database
import { getDatabase } from "@connectors/database";

// Utility functions and libraries
import { parseGlobalPermissions } from "@lib/util";
import _ from "lodash";

// Collection names
const USERS_COLLECTION = "user";
const WORKSPACES_COLLECTION = "workspaces";
const ENTITIES_COLLECTION = "entities";
const PROJECTS_COLLECTION = "projects";
const TEMPLATES_COLLECTION = "templates";

// Default Workspace permissions
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

// Default global permissions
export const DEFAULT_GLOBAL_PERMISSIONS: UserGlobalPermissions = {
  features: {
    import: false,
    scan: false,
    ai: false,
    api: false,
  },
  workspaces: {
    create: false,
  },
};

export class Admin {
  static getMetrics = async (): Promise<AdminMetrics> => {
    const [users, workspaces, entities, projects, templates] = await Promise.all([
      getDatabase().collection(USERS_COLLECTION).countDocuments(),
      getDatabase().collection(WORKSPACES_COLLECTION).countDocuments(),
      getDatabase().collection(ENTITIES_COLLECTION).countDocuments(),
      getDatabase().collection(PROJECTS_COLLECTION).countDocuments(),
      getDatabase().collection(TEMPLATES_COLLECTION).countDocuments(),
    ]);

    return { users, workspaces, entities, projects, templates };
  };

  static getUsers = async (): Promise<AdminUser[]> => {
    const [users, workspaces] = await Promise.all([
      getDatabase().collection<UserModel>(USERS_COLLECTION).find().toArray(),
      getDatabase()
        .collection<WorkspaceModel>(WORKSPACES_COLLECTION)
        .find({}, { projection: { owner: 1, collaborators: 1 } })
        .toArray(),
    ]);

    return users.map((user) => {
      const userId = String(user._id);

      // Count the number of Workspaces owned by the User
      const workspaceOwnerCount = workspaces.filter((workspace: WorkspaceModel) => workspace.owner === userId).length;

      // Count the number of Workspaces the User is a collaborator on
      let workspaceCollaboratorCount = 0;
      for (const workspace of workspaces) {
        if (workspace.collaborators.find((collaborator: Collaborator) => collaborator._id === userId)) {
          workspaceCollaboratorCount++;
        }
      }

      const userPermissions = parseGlobalPermissions(user.permissions);
      const permissions: UserGlobalPermissions = {
        features: {
          ai: userPermissions.features.ai,
          api: userPermissions.features.api,
          import: userPermissions.features.import,
          scan: userPermissions.features.scan,
        },
        workspaces: {
          create: userPermissions.workspaces.create,
        },
      };

      return {
        _id: userId,
        name: user.name || "",
        email: user.email || "",
        role: user.role || "user",
        workspaces: workspaceOwnerCount + workspaceCollaboratorCount,
        permissions,
        banned: user.banned ?? false,
        lastLogin: user.lastLogin || "",
      };
    });
  };

  static getWorkspaces = async (): Promise<AdminWorkspace[]> => {
    const [workspaces, entityAttrCounts] = await Promise.all([
      getDatabase().collection(WORKSPACES_COLLECTION).find().toArray(),
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .aggregate([{ $project: { attrCount: { $size: { $ifNull: ["$attributes", []] } } } }])
        .toArray(),
    ]);

    const attrributeCountMap = new Map(
      entityAttrCounts.map((entity) => [entity._id as string, entity.attrCount as number]),
    );

    return workspaces.map((workspace) => {
      const entityIds: string[] = workspace.entities || [];
      const attributeCount = entityIds.reduce((sum, id) => sum + (attrributeCountMap.get(id) ?? 0), 0);

      return {
        _id: String(workspace._id),
        name: workspace.name || "",
        description: workspace.description || "",
        owner: workspace.owner || "",
        entities: entityIds.length,
        templates: (workspace.templates || []).length,
        attributes: attributeCount,
      };
    });
  };

  static getUserGlobalPermissions = async (_id: string): Promise<UserGlobalPermissions> => {
    const userResult = await getDatabase().collection<UserModel>(USERS_COLLECTION).findOne({ _id: _id });

    // Check that the User was located, if not return default permissions
    if (!userResult) {
      return DEFAULT_GLOBAL_PERMISSIONS;
    }

    return parseGlobalPermissions(userResult.permissions);
  };

  static setUserGlobalPermissions = async (
    _id: string,
    permissions: UserGlobalPermissions,
  ): Promise<IResponseMessage> => {
    const user = await User.getOne(_id);

    if (_.isNull(user)) {
      return {
        success: false,
        message: "User not found",
      };
    }

    const update: { $set: UserModel } = {
      $set: {
        ...user,
        permissions: JSON.stringify(permissions) as unknown as UserGlobalPermissions,
      },
    };

    const response = await getDatabase().collection<UserModel>(USERS_COLLECTION).updateOne({ _id: _id }, update);
    const successStatus = response.modifiedCount === 1 || response.matchedCount === 1;

    return {
      success: successStatus,
      message: successStatus ? "Updated User permissions successfully" : "Unable to update User permissions",
    };
  };

  static getUserWorkspacePermissions = async (_id: string, workspace: string): Promise<UserWorkspacePermissions> => {
    const workspaceResult = await getDatabase()
      .collection<WorkspaceModel>(WORKSPACES_COLLECTION)
      .findOne({ _id: workspace });

    // Check that the Workspace was located, if not return default permissions
    if (!workspaceResult) {
      return DEFAULT_WORKSPACE_PERMISSIONS;
    }

    // Get the permissions of the User, assuming they are a collaborator
    const collaboratorResult = workspaceResult.collaborators.find(
      (collaborator: Collaborator) => collaborator._id === _id,
    );
    if (collaboratorResult) {
      return collaboratorResult.permissions;
    } else {
      // In the case where the User is the owner, return all permissions enabled by default
      return {
        administration: {
          edit: true,
          invite: true,
        },
        entities: {
          create: true,
          edit: true,
          archive: true,
        },
        projects: {
          create: true,
          edit: true,
          archive: true,
        },
        templates: {
          create: true,
          edit: true,
          archive: true,
        },
      };
    }
  };

  static setUserWorkspacePermissions = async (
    _id: string,
    workspace: string,
    permissions: Partial<UserWorkspacePermissions>,
  ): Promise<IResponseMessage> => {
    // Get the current User's Workspace permissions
    const workspaceResult = await getDatabase()
      .collection<WorkspaceModel>(WORKSPACES_COLLECTION)
      .findOne({ _id: workspace });
    if (!workspaceResult) {
      return {
        success: false,
        message: "Unable to locate Workspace",
      };
    }

    const collaboratorResult = workspaceResult.collaborators.find(
      (collaborator: Collaborator) => collaborator._id === _id,
    );
    if (!collaboratorResult) {
      return {
        success: false,
        message: "Unable to locate Collaborator within Workspace",
      };
    }

    // Create copy of permissions to update and copy any specified changes
    const updatedPermissions = _.cloneDeep(collaboratorResult.permissions);
    if (permissions?.administration?.edit !== undefined)
      updatedPermissions.administration.edit = permissions.administration.edit;
    if (permissions?.administration?.invite !== undefined)
      updatedPermissions.administration.invite = permissions.administration.invite;
    if (permissions?.entities?.create !== undefined) updatedPermissions.entities.create = permissions.entities.create;
    if (permissions?.entities?.edit !== undefined) updatedPermissions.entities.edit = permissions.entities.edit;
    if (permissions?.entities?.archive !== undefined)
      updatedPermissions.entities.archive = permissions.entities.archive;
    if (permissions?.projects?.create !== undefined) updatedPermissions.projects.create = permissions.projects.create;
    if (permissions?.projects?.edit !== undefined) updatedPermissions.projects.edit = permissions.projects.edit;
    if (permissions?.projects?.archive !== undefined)
      updatedPermissions.projects.archive = permissions.projects.archive;
    if (permissions?.templates?.create !== undefined)
      updatedPermissions.templates.create = permissions.templates.create;
    if (permissions?.templates?.edit !== undefined) updatedPermissions.templates.edit = permissions.templates.edit;
    if (permissions?.templates?.archive !== undefined)
      updatedPermissions.templates.archive = permissions.templates.archive;

    // Apply update in-place in list of Collaborators
    for (const collaborator of workspaceResult.collaborators) {
      if (collaborator._id === _id) {
        collaborator.permissions = _.cloneDeep(updatedPermissions);
        break;
      }
    }

    // Create and apply updated Collaborators
    const update: Record<string, unknown> = {
      $set: {
        collaborators: workspaceResult.collaborators,
      },
    };

    const result = await getDatabase()
      .collection<WorkspaceModel>(WORKSPACES_COLLECTION)
      .updateOne({ _id: workspace }, update);

    return {
      success: result.modifiedCount === 1,
      message:
        result.modifiedCount === 1
          ? "User Workspace permissions updated"
          : "Unable to update User Workspace permissions",
    };
  };

  static getUserCollatedPermissions = async (_id: string, workspace: string): Promise<UserCollatedPermissions> => {
    const userResult = await getDatabase().collection<UserModel>(USERS_COLLECTION).findOne({ _id: _id });
    const workspaceResult = await getDatabase()
      .collection<WorkspaceModel>(WORKSPACES_COLLECTION)
      .findOne({ _id: workspace });

    // Check that both the User and Workspace were located, if not return default permissions
    if (!userResult || !workspaceResult) {
      return {
        workspace: DEFAULT_WORKSPACE_PERMISSIONS,
        global: DEFAULT_GLOBAL_PERMISSIONS,
      };
    }

    const globalPermissions = parseGlobalPermissions(userResult.permissions);

    // Check if User is Workspace owner or Collaborator
    if (workspaceResult.owner === _id) {
      // If owner, all permissions granted
      return {
        workspace: {
          administration: {
            edit: true,
            invite: true,
          },
          entities: {
            create: true,
            edit: true,
            archive: true,
          },
          projects: {
            create: true,
            edit: true,
            archive: true,
          },
          templates: {
            create: true,
            edit: true,
            archive: true,
          },
        },
        global: globalPermissions,
      };
    } else {
      const workspacePermissions = workspaceResult.collaborators.filter((collaborator: Collaborator) => {
        return collaborator._id === _id;
      });

      if (workspacePermissions.length !== 1) {
        return {
          workspace: DEFAULT_WORKSPACE_PERMISSIONS, // Replace with default permissions
          global: globalPermissions,
        };
      }

      return {
        workspace: workspacePermissions[0].permissions,
        global: globalPermissions,
      };
    }
  };

  static setBanStatus = async (_id: string, banned: boolean): Promise<IResponseMessage> => {
    const result = await getDatabase()
      .collection<UserModel>(USERS_COLLECTION)
      .updateOne({ _id: _id }, { $set: { banned } });

    return {
      success: result.modifiedCount === 1,
      message: result.modifiedCount === 1 ? "User status updated" : "Unable to update user status",
    };
  };

  static setUserRole = async (_id: string, role: string): Promise<IResponseMessage> => {
    const result = await getDatabase()
      .collection<UserModel>(USERS_COLLECTION)
      .updateOne({ _id: _id }, { $set: { role } });

    return {
      success: result.modifiedCount === 1,
      message: result.modifiedCount === 1 ? "User role updated" : "Unable to update user role",
    };
  };
}
