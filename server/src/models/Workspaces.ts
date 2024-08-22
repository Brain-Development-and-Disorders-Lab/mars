import {
  EntityModel,
  IWorkspace,
  ProjectModel,
  ResponseMessage,
  WorkspaceModel,
} from "@types";
import { getDatabase } from "../connectors/database";
import { getIdentifier } from "src/util";
import { Entities } from "./Entities";
import { Projects } from "./Projects";
import _ from "lodash";

// Collection name
const WORKSPACES_COLLECTION = "workspaces";

export class Workspaces {
  /**
   * Get all Workspace entries from the Workspaces collection where the user
   * is either the owner or a collaborator
   * @returns Collection of all Workspace entries
   */
  static all = async (): Promise<WorkspaceModel[]> => {
    return await getDatabase()
      .collection<WorkspaceModel>(WORKSPACES_COLLECTION)
      .find()
      .toArray();
  };

  /**
   * Get one Workspace entry from the Workspaces collection where the user
   * is either the owner or a collaborator
   * @returns Workspace entry
   */
  static getOne = async (_id: string): Promise<WorkspaceModel | null> => {
    return await getDatabase()
      .collection<WorkspaceModel>(WORKSPACES_COLLECTION)
      .findOne({
        _id: _id,
      });
  };

  /**
   * Get all Entities present in a Workspace
   * @param _id Workspace identifier
   * @return {Promise<EntityModel[]>}
   */
  static getEntities = async (_id: string): Promise<EntityModel[]> => {
    const workspace = await Workspaces.getOne(_id);
    if (!_.isNull(workspace)) {
      return await Entities.getMany(workspace.entities);
    } else {
      return [];
    }
  };

  /**
   * Get all Projects present in a Workspace
   * @param _id Workspace identifier
   * @return {Promise<ProjectModel[]>}
   */
  static getProjects = async (_id: string): Promise<ProjectModel[]> => {
    const workspace = await Workspaces.getOne(_id);
    if (!_.isNull(workspace)) {
      return await Projects.getMany(workspace.projects);
    } else {
      return [];
    }
  };

  static addEntity = async (
    _id: string,
    entity: string,
  ): Promise<ResponseMessage> => {
    const workspace = await Workspaces.getOne(_id);

    // Add the Entity to list of all Entities within a Workspace
    if (workspace) {
      const entities = [..._.cloneDeep(workspace.entities)];
      entities.push(entity);
    }

    return {
      success: false,
      message: "Unable to add Entity to Workspace",
    };
  };

  /**
   * Create a new Workspace entry
   * @param workspace Workspace data
   * @return {ResponseMessage}
   */
  static create = async (workspace: IWorkspace): Promise<ResponseMessage> => {
    const joinedWorkspace: WorkspaceModel = {
      _id: getIdentifier("workspace"), // Generate new identifier
      ...workspace, // Unpack existing IEntity fields
    };
    const response = await getDatabase()
      .collection<WorkspaceModel>(WORKSPACES_COLLECTION)
      .insertOne(joinedWorkspace);

    return {
      success: response.acknowledged,
      message: response.acknowledged
        ? response.insertedId.toString()
        : "Unable to create Workspace",
    };
  };

  static update = async (updated: WorkspaceModel): Promise<ResponseMessage> => {
    // Check if the Workspace exists
    const workspace = await Workspaces.getOne(updated._id);
    if (_.isNull(workspace)) {
      return {
        success: false,
        message: "Workspace not found",
      };
    }

    // Construct object containing updates to Workspace
    const update = {
      $set: {
        ...workspace,
      },
    };

    // Execute the update
    const response = await getDatabase()
      .collection<WorkspaceModel>(WORKSPACES_COLLECTION)
      .updateOne({ _id: updated._id }, update);

    return {
      success: true,
      message:
        response.modifiedCount == 1
          ? "Updated Entity"
          : "No changes made to Entity",
    };
  };
}
