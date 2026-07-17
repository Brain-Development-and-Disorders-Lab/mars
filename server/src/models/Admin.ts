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

// Database
import { getDatabase } from "@connectors/database";

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

      const permissions: UserGlobalPermissions = {
        features: {
          ai: user.permissions.features.ai,
          api: user.permissions.features.api,
          import: user.permissions.features.import,
          scan: user.permissions.features.scan,
        },
        workspaces: {
          create: user.permissions.workspaces.create,
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

    const workspacePermissions = workspaceResult.collaborators.filter((collaborator: Collaborator) => {
      return collaborator._id === _id;
    });

    if (workspacePermissions.length !== 1) {
      return {
        workspace: DEFAULT_WORKSPACE_PERMISSIONS, // Replace with default permissions
        global: userResult.permissions,
      };
    }

    return {
      workspace: workspacePermissions[0].permissions,
      global: userResult.permissions,
    };
  };

  static getUserGlobalPermissions = async (_id: string): Promise<UserGlobalPermissions> => {
    const userResult = await getDatabase().collection<UserModel>(USERS_COLLECTION).findOne({ _id: _id });

    // Check that the User was located, if not return default permissions
    if (!userResult) {
      return DEFAULT_GLOBAL_PERMISSIONS;
    }

    return userResult.permissions;
  };

  static setUserGlobalPermissions = async (
    _id: string,
    permissions: Partial<UserGlobalPermissions>,
  ): Promise<IResponseMessage> => {
    const update: Record<string, unknown> = {};
    if (permissions?.features?.ai !== undefined) update["applications.ai"] = permissions.features.ai;
    if (permissions?.features?.api !== undefined) update["applications.api"] = permissions.features.api;
    if (permissions?.features?.import !== undefined) update["applications.import"] = permissions.features.import;
    if (permissions?.features?.scan !== undefined) update["applications.scan"] = permissions.features.scan;

    const result = await getDatabase()
      .collection<UserModel>(USERS_COLLECTION)
      .updateOne({ _id: _id }, { $set: update });

    return {
      success: result.modifiedCount === 1,
      message: result.modifiedCount === 1 ? "User global permissions updated" : "Unable to update user features",
    };
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
