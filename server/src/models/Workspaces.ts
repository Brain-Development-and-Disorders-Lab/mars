// Custom types
import {
  ActivityModel,
  AttributeModel,
  EntityModel,
  IWorkspace,
  ProjectModel,
  ResponseMessage,
  WorkspaceModel,
} from "@types";

// Utility functions and libraries
import { getDatabase } from "../connectors/database";
import { getIdentifier } from "../util";
import dayjs from "dayjs";
import _ from "lodash";

// Models
import { Activity } from "./Activity";
import { Entities } from "./Entities";
import { Projects } from "./Projects";
import { Users } from "./Users";
import { Attributes } from "./Attributes";

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
   * Add an Entity to an existing Workspace
   * @param _id Workspace identifier to receive the Entity
   * @param entity Entity identifier to be added to the Workspace
   * @return {Promise<ResponseMessage>}
   */
  static addEntity = async (
    _id: string,
    entity: string,
  ): Promise<ResponseMessage> => {
    const workspace = await Workspaces.getOne(_id);
    if (_.isNull(workspace)) {
      return {
        success: false,
        message: "Workspace not found",
      };
    }

    // Extract the collection of Entities from the Workspace
    if (_.includes(workspace.entities, entity)) {
      // Check if the Workspace already includes the Entity
      return {
        success: true,
        message: "Workspace already contains Entity",
      };
    }

    // Push the new Entity
    const update = {
      $set: {
        entities: [...workspace.entities, entity],
      },
    };

    // Execute the update
    const response = await getDatabase()
      .collection<WorkspaceModel>(WORKSPACES_COLLECTION)
      .updateOne({ _id: _id }, update);

    return {
      success: response.modifiedCount === 1,
      message:
        response.modifiedCount === 1
          ? "Added Entity to Workspace"
          : "Unable to add Entity to Workspace",
    };
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

  /**
   * Add a Project to an existing Workspace
   * @param _id Workspace identifier to receive the Project
   * @param project Project identifier to be added to the Workspace
   * @return {Promise<ResponseMessage>}
   */
  static addProject = async (
    _id: string,
    project: string,
  ): Promise<ResponseMessage> => {
    const workspace = await Workspaces.getOne(_id);
    if (_.isNull(workspace)) {
      return {
        success: false,
        message: "Workspace not found",
      };
    }

    // Extract the collection of Projects from the Workspace
    const projects = _.cloneDeep(workspace.projects);
    if (_.includes(projects, project)) {
      // Check if the Workspace already includes the Project
      return {
        success: true,
        message: "Workspace already contains Project",
      };
    }

    // Push the new Project
    projects.push(project);
    const update = {
      $set: {
        projects: projects,
      },
    };

    // Execute the update
    const response = await getDatabase()
      .collection<WorkspaceModel>(WORKSPACES_COLLECTION)
      .updateOne({ _id: _id }, update);

    return {
      success: response.modifiedCount === 1,
      message:
        response.modifiedCount === 1
          ? "Added Project to Workspace"
          : "Unable to add Project to Workspace",
    };
  };

  /**
   * Get all Activities present in the Workspace
   * @param _id Workspace identifier
   * @return {Promise<ActivityModel[]>}
   */
  static getActivity = async (_id: string): Promise<ActivityModel[]> => {
    const workspace = await Workspaces.getOne(_id);
    if (!_.isNull(workspace)) {
      return await Activity.getMany(workspace.activity);
    } else {
      return [];
    }
  };

  /**
   * Add Activity to an existing Workspace
   * @param _id Workspace identifier to receive the Activity
   * @param activity Activity identifier to be added to the Workspace
   * @return {Promise<ResponseMessage>}
   */
  static addActivity = async (
    _id: string,
    activity: string,
  ): Promise<ResponseMessage> => {
    const workspace = await Workspaces.getOne(_id);
    if (_.isNull(workspace)) {
      return {
        success: false,
        message: "Workspace not found",
      };
    }

    // Extract the collection of Activity from the Workspace
    const activities = _.cloneDeep(workspace.activity);
    if (_.includes(activities, activity)) {
      // Check if the Workspace already includes the Activity
      return {
        success: true,
        message: "Workspace already contains this Activity",
      };
    }

    // Push the new Activity
    activities.push(activity);
    const update = {
      $set: {
        activity: activities,
      },
    };

    // Execute the update
    const response = await getDatabase()
      .collection<WorkspaceModel>(WORKSPACES_COLLECTION)
      .updateOne({ _id: _id }, update);

    return {
      success: response.modifiedCount === 1,
      message:
        response.modifiedCount === 1
          ? "Added Activity to Workspace"
          : "Unable to add Activity to Workspace",
    };
  };

  /**
   * Retrieve all Attributes in a Workspace
   * @param _id Workspace identifier
   * @return {Promise<AttributeModel[]>}
   */
  static getAttributes = async (_id: string): Promise<AttributeModel[]> => {
    const workspace = await Workspaces.getOne(_id);
    if (!_.isNull(workspace)) {
      return await Attributes.getMany(workspace.attributes);
    } else {
      return [];
    }
  };

  /**
   * Add an Attribute to an existing Workspace
   * @param _id Workspace identifier to receive the Attribute
   * @param attribute Attribute identifier to be added to the Workspace
   * @return {Promise<ResponseMessage>}
   */
  static addAttribute = async (
    _id: string,
    attribute: string,
  ): Promise<ResponseMessage> => {
    const workspace = await Workspaces.getOne(_id);
    if (_.isNull(workspace)) {
      return {
        success: false,
        message: "Workspace not found",
      };
    }

    // Extract the collection of Attributes from the Workspace
    const attributes = _.cloneDeep(workspace.attributes);
    if (_.includes(attributes, attribute)) {
      // Check if the Workspace already includes the Attribute
      return {
        success: true,
        message: "Workspace already contains Attribute",
      };
    }

    // Push the new Attribute
    attributes.push(attribute);
    const update = {
      $set: {
        attributes: attributes,
      },
    };

    // Execute the update
    const response = await getDatabase()
      .collection<WorkspaceModel>(WORKSPACES_COLLECTION)
      .updateOne({ _id: _id }, update);

    return {
      success: response.modifiedCount === 1,
      message:
        response.modifiedCount === 1
          ? "Added Attribute to Workspace"
          : "Unable to add Attribute to Workspace",
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
      timestamp: dayjs(Date.now()).toISOString(),
      ...workspace, // Unpack existing IEntity fields
    };
    const response = await getDatabase()
      .collection<WorkspaceModel>(WORKSPACES_COLLECTION)
      .insertOne(joinedWorkspace);

    // Bootstrap the Workspace with an example Entity and Project
    await Users.bootstrap(joinedWorkspace.owner, joinedWorkspace._id);

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

    // Construct object containing updates for Workspace
    const update: { $set: Partial<IWorkspace> } = {
      $set: {
        name: updated.name,
        description: updated.description,
        collaborators: updated.collaborators,
        entities: updated.entities,
        projects: updated.projects,
        attributes: updated.attributes,
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
          ? "Updated Workspace"
          : "No changes made to Workspace",
    };
  };
}
