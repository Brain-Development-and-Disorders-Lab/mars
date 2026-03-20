// Custom types
import {
  ActivityModel,
  AttributeModel,
  EntityModel,
  IWorkspace,
  ProjectModel,
  IResponseMessage,
  WorkspaceModel,
  ResponseData,
} from "@types";

// Utility functions and libraries
import { getDatabase } from "@connectors/database";
import { getIdentifier } from "@lib/util";
import dayjs from "dayjs";
import _ from "lodash";

// Models
import { Activity } from "@models/Activity";
import { Entities } from "@models/Entities";
import { Projects } from "@models/Projects";
import { User } from "@models/User";
import { Templates } from "@models/Templates";

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
   * @return {Promise<IResponseMessage>}
   */
  static addEntity = async (
    _id: string,
    entity: string,
  ): Promise<IResponseMessage> => {
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
   * @return {Promise<IResponseMessage>}
   */
  static addProject = async (
    _id: string,
    project: string,
  ): Promise<IResponseMessage> => {
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
   * @return {Promise<IResponseMessage>}
   */
  static addActivity = async (
    _id: string,
    activity: string,
  ): Promise<IResponseMessage> => {
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
   * Retrieve all Templates in a Workspace
   * @param _id Workspace identifier
   * @return {Promise<AttributeModel[]>}
   */
  static getTemplates = async (_id: string): Promise<AttributeModel[]> => {
    const workspace = await Workspaces.getOne(_id);
    if (!_.isNull(workspace)) {
      return await Templates.getMany(workspace.templates);
    } else {
      return [];
    }
  };

  /**
   * Add a Template to an existing Workspace
   * @param _id Workspace identifier to receive the Template
   * @param template Template identifier to be added to the Workspace
   * @return {Promise<IResponseMessage>}
   */
  static addTemplate = async (
    _id: string,
    template: string,
  ): Promise<ResponseData<string>> => {
    const workspace = await Workspaces.getOne(_id);
    if (_.isNull(workspace)) {
      return {
        success: false,
        message: "Workspace not found",
        data: "",
      };
    }

    // Extract the collection of Templates from the Workspace
    const templates = _.cloneDeep(workspace.templates);
    if (_.includes(templates, template)) {
      // Check if the Workspace already includes the Template
      return {
        success: true,
        message: "Workspace already contains Template",
        data: "",
      };
    }

    // Push the new Template
    templates.push(template);
    const update = {
      $set: {
        templates: templates,
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
          ? "Added Template to Workspace"
          : "Unable to add Template to Workspace",
      data: workspace._id,
    };
  };

  /**
   * Create a new Workspace entry
   * @param workspace Workspace data
   * @return {IResponseMessage}
   */
  static create = async (
    workspace: IWorkspace,
  ): Promise<ResponseData<string>> => {
    const joinedWorkspace: WorkspaceModel = {
      _id: getIdentifier("workspace"), // Generate new identifier
      timestamp: dayjs(Date.now()).toISOString(),
      ...workspace, // Unpack existing Workspace fields
    };
    const response = await getDatabase()
      .collection<WorkspaceModel>(WORKSPACES_COLLECTION)
      .insertOne(joinedWorkspace);

    // Bootstrap the Workspace with an example Entity and Project
    await User.bootstrap(joinedWorkspace.owner, joinedWorkspace._id);

    return {
      success: response.acknowledged,
      message: response.acknowledged
        ? "Created new Workspace"
        : "Unable to create Workspace",
      data: response.insertedId.toString(),
    };
  };

  static update = async (
    updated: WorkspaceModel,
  ): Promise<IResponseMessage> => {
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
        public: updated.public,
        collaborators: updated.collaborators,
        entities: updated.entities,
        projects: updated.projects,
        templates: updated.templates,
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

  /**
   * Basic access check function to validate that the User has permission to interact with a Workspace
   * @param user Identifier of the User attempting to interact with the Workspace
   * @param workspace Identifier of the target Workspace
   * @return {Promise<boolean>} `true` if the User has access, `false` if not
   */
  static checkAccess = async (
    user: string,
    workspace: string,
  ): Promise<boolean> => {
    // Special case where no Workspaces exist for the User, `workspace` will be `""`
    if (workspace === "") {
      return true;
    }

    const workspaceResult = await Workspaces.getOne(workspace);
    if (workspaceResult === null) {
      return false;
    }

    return (
      workspaceResult.owner === user ||
      _.includes(workspaceResult.collaborators, user)
    );
  };
}
