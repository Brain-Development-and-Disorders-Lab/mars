// Custom types
import { AdminMetrics, AdminUser, AdminWorkspace, IResponseMessage, UserFeatures } from "@types";

// Database
import { getDatabase } from "@connectors/database";
import { ObjectId } from "mongodb";

// Collection names
const USERS_COLLECTION = "user";
const WORKSPACES_COLLECTION = "workspaces";
const ENTITIES_COLLECTION = "entities";
const PROJECTS_COLLECTION = "projects";
const TEMPLATES_COLLECTION = "templates";

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
      getDatabase().collection(USERS_COLLECTION).find().toArray(),
      getDatabase()
        .collection(WORKSPACES_COLLECTION)
        .find({}, { projection: { owner: 1, collaborators: 1 } })
        .toArray(),
    ]);

    return users.map((user) => {
      const userId = (user._id as ObjectId).toString();
      const workspaceCount = workspaces.filter(
        (workspace) =>
          workspace.owner === userId ||
          (Array.isArray(workspace.collaborators) && workspace.collaborators.includes(userId)),
      ).length;

      const features: UserFeatures = {
        ai: user.features?.ai ?? false,
      };

      return {
        _id: userId,
        name: user.name || "",
        email: user.email || "",
        role: user.role || "user",
        workspaces: workspaceCount,
        features,
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
        _id: workspace._id as string,
        name: workspace.name || "",
        description: workspace.description || "",
        owner: workspace.owner || "",
        entities: entityIds.length,
        templates: (workspace.templates || []).length,
        attributes: attributeCount,
      };
    });
  };

  static getCurrentUserFeatures = async (_id: string): Promise<UserFeatures> => {
    const user = await getDatabase()
      .collection(USERS_COLLECTION)
      .findOne({ _id: new ObjectId(_id) });
    return { ai: user?.features?.ai ?? false };
  };

  static setUserFeatures = async (_id: string, features: Partial<UserFeatures>): Promise<IResponseMessage> => {
    const update: Record<string, unknown> = {};
    if (features.ai !== undefined) update["features.ai"] = features.ai;

    const result = await getDatabase()
      .collection(USERS_COLLECTION)
      .updateOne({ _id: new ObjectId(_id) }, { $set: update });

    return {
      success: result.modifiedCount === 1,
      message: result.modifiedCount === 1 ? "User features updated" : "Unable to update user features",
    };
  };

  static setUserRole = async (_id: string, role: string): Promise<IResponseMessage> => {
    const result = await getDatabase()
      .collection(USERS_COLLECTION)
      .updateOne({ _id: new ObjectId(_id) }, { $set: { role } });

    return {
      success: result.modifiedCount === 1,
      message: result.modifiedCount === 1 ? "User role updated" : "Unable to update user role",
    };
  };
}
