// Models
import { Entities } from "./Entities";

// Custom types
import {
  EntityModel,
  IProject,
  ProjectHistory,
  ProjectModel,
  ResponseMessage,
} from "@types";

// Utility functions and libraries
import _ from "lodash";
import { getDatabase } from "../connectors/database";
import { getIdentifier } from "../util";
import dayjs from "dayjs";
import Papa from "papaparse";
import consola from "consola";

// Generate history version IDs
import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("1234567890abcdef", 10);

// Collection name
const PROJECTS_COLLECTION = "projects";

export class Projects {
  /**
   * Get all Project entries from the Projects collection
   * @returns {Promise<ProjectModel[]>} Collection of all Project entries
   */
  static all = async (): Promise<ProjectModel[]> => {
    return await getDatabase()
      .collection<ProjectModel>(PROJECTS_COLLECTION)
      .find()
      .toArray();
  };

  static getOne = async (_id: string) => {
    return await getDatabase()
      .collection<ProjectModel>(PROJECTS_COLLECTION)
      .findOne({ _id: _id });
  };

  static getMany = async (projects: string[]) => {
    return await getDatabase()
      .collection<ProjectModel>(PROJECTS_COLLECTION)
      .find({ _id: { $in: projects } })
      .toArray();
  };

  static exists = async (_id: string): Promise<boolean> => {
    const project = await this.getOne(_id);
    return !_.isNull(project);
  };

  static create = async (project: IProject): Promise<ResponseMessage> => {
    // Create a `ProjectModel` instance by adding an identifier and unpacking given Project data
    const projectModel: ProjectModel = {
      _id: getIdentifier("project"),
      timestamp: dayjs(Date.now()).toISOString(),
      ...project,
      history: [],
    };

    const response = await getDatabase()
      .collection<ProjectModel>(PROJECTS_COLLECTION)
      .insertOne(projectModel);
    const successStatus = _.isEqual(response.insertedId, projectModel._id);

    return {
      success: successStatus,
      message: successStatus
        ? response.insertedId
        : "Could not create new Project",
    };
  };

  static update = async (updated: ProjectModel): Promise<ResponseMessage> => {
    const project = await this.getOne(updated._id);

    if (_.isNull(project)) {
      return {
        success: false,
        message: "Project to update does not exist",
      };
    }

    const update: { $set: IProject } = {
      $set: {
        ...project,
      },
    };

    // Name
    if (!_.isUndefined(updated.name)) {
      update.$set.name = updated.name;
    }

    // Description
    if (!_.isUndefined(updated.description)) {
      update.$set.description = updated.description;
    }

    // Collaborators
    if (!_.isUndefined(updated.collaborators)) {
      update.$set.collaborators = updated.collaborators;
    }

    // Entities to add and remove
    if (!_.isUndefined(updated.entities)) {
      const toAdd = _.difference(updated.entities, project.entities);
      for await (const entity of toAdd) {
        await Entities.addProject(entity, project._id);
      }
      const toRemove = _.difference(project.entities, updated.entities);
      for await (const entity of toRemove) {
        await Entities.removeProject(entity, project._id);
      }
      update.$set.entities = updated.entities;
    }

    const response = await getDatabase()
      .collection<ProjectModel>(PROJECTS_COLLECTION)
      .updateOne({ _id: project._id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus ? "Updated Project" : "Could not update Project",
    };
  };

  /**
   * Add a history entry to an Project based on provided Project state
   * @param historyProject Existing Project state to add to Project history
   * @return {Promise<ResponseMessage>}
   */
  static addHistory = async (
    historyProject: ProjectModel,
  ): Promise<ResponseMessage> => {
    const project = await Projects.getOne(historyProject._id);
    if (_.isNull(project)) {
      return {
        success: false,
        message: "Project not found",
      };
    }

    const historyProjectModel: ProjectHistory = {
      _id: historyProject._id,
      timestamp: dayjs(Date.now()).toISOString(), // Timestamp on history creation
      version: nanoid(),
      name: historyProject.name,
      owner: historyProject.owner,
      collaborators: historyProject.collaborators,
      archived: historyProject.archived,
      created: historyProject.created,
      description: historyProject.description,
      entities: historyProject.entities,
    };

    const update: { $set: Partial<ProjectModel> } = {
      $set: {
        history: [historyProjectModel, ...project.history],
      },
    };

    const response = await getDatabase()
      .collection<ProjectModel>(PROJECTS_COLLECTION)
      .updateOne({ _id: project._id }, update);
    if (response.modifiedCount > 0) {
      consola.info("Added history to Project:", historyProject._id);
    }

    return {
      success: true,
      message:
        response.modifiedCount === 1
          ? "Added history to Project"
          : "No history added to Project",
    };
  };

  /**
   * Set the archive state of a Project
   * @param _id Project identifier to archive
   * @param state Project archive state
   * @return {Promise<ResponseMessage>}
   */
  static setArchived = async (
    _id: string,
    state: boolean,
  ): Promise<ResponseMessage> => {
    consola.debug("Setting archive state of Project:", _id, "Archived:", state);
    const project = await Projects.getOne(_id);
    if (_.isNull(project)) {
      consola.error("Unable to retrieve Project:", _id);
      return {
        success: false,
        message: "Error retrieving existing Project",
      };
    }

    // Update the archived state
    project.archived = state;
    const update: { $set: IProject } = {
      $set: {
        ...project,
      },
    };

    const response = await getDatabase()
      .collection<ProjectModel>(PROJECTS_COLLECTION)
      .updateOne({ _id: _id }, update);
    if (response.modifiedCount > 0) {
      consola.info("Set archive state of Project:", _id, "Archived:", state);
    }

    return {
      success: true,
      message:
        response.modifiedCount === 1
          ? "Set archive state of Project"
          : "No changes made to Project",
    };
  };

  /**
   * Delete a Project
   * @param _id Project identifier to delete
   * @return {ResponseMessage}
   */
  static delete = async (_id: string): Promise<ResponseMessage> => {
    const project = await Projects.getOne(_id);
    // Remove Entities from Project
    if (project) {
      for await (const entity of project.entities) {
        await Entities.removeProject(entity, project._id);
      }
    }

    // Execute delete operation
    const response = await getDatabase()
      .collection<ProjectModel>(PROJECTS_COLLECTION)
      .deleteOne({ _id: _id });

    return {
      success: response.deletedCount > 0,
      message:
        response.deletedCount > 0
          ? "Deleted Project successfully"
          : "Unable to delete Project",
    };
  };

  static addEntity = async (
    _id: string,
    entity: string,
  ): Promise<ResponseMessage> => {
    const project = await this.getOne(_id);

    if (_.isNull(project)) {
      return {
        success: false,
        message: "Project does not exist",
      };
    }

    const entityCollection = _.cloneDeep(project.entities);
    entityCollection.push(entity);

    const update = {
      $set: {
        entities: entityCollection,
      },
    };

    const response = await getDatabase()
      .collection<ProjectModel>(PROJECTS_COLLECTION)
      .updateOne({ _id: _id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus
        ? "Added Entity to Project"
        : "Could not add Entity to Project",
    };
  };

  static addEntities = async (
    _id: string,
    entities: string[],
  ): Promise<ResponseMessage> => {
    const project = await this.getOne(_id);

    if (_.isNull(project)) {
      return {
        success: false,
        message: "Project does not exist",
      };
    }

    const update = {
      $set: {
        entities: _.union(_.cloneDeep(project.entities), entities),
      },
    };

    const response = await getDatabase()
      .collection<ProjectModel>(PROJECTS_COLLECTION)
      .updateOne({ _id: _id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus
        ? "Added Entities to Project"
        : "Could not add Entities to Project",
    };
  };

  static removeEntity = async (
    _id: string,
    entity: string,
  ): Promise<ResponseMessage> => {
    const project = await this.getOne(_id);

    if (_.isNull(project)) {
      return {
        success: false,
        message: "Project does not exist",
      };
    }

    const update = {
      $set: {
        entities: project.entities.filter((e) => e !== entity),
      },
    };

    const response = await getDatabase()
      .collection<ProjectModel>(PROJECTS_COLLECTION)
      .updateOne({ _id: _id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus
        ? "Removed Entity from Project"
        : "Could not remove Entity from Project",
    };
  };

  /**
   * Generate export data for the Project
   * @param _id Project identifier
   * @param format File format, either JSON or CSV
   * @param fields Optionally specify fields to include in export
   * @returns {Promise<string>}
   */
  static export = async (
    _id: string,
    format: "json" | "csv",
    fields?: string[],
  ): Promise<string> => {
    const project = await this.getOne(_id);

    if (_.isNull(project)) {
      return "";
    }

    // Remove `history` field
    delete (project as any)["history"];

    if (_.isEqual(format, "csv")) {
      let exportFields = fields;

      // Handle CSV format
      const headers: string[] = ["ID", "Name"]; // Headers for CSV file
      const row: string[] = [project._id, project.name]; // First row containing export data

      // Default behavior is to export all fields
      if (_.isUndefined(exportFields)) {
        // Add standard string fields
        exportFields = ["created", "owner", "description"];
      }

      // Iterate through the list of "fields" and create row representation
      for (const field of exportFields) {
        if (_.isEqual(field, "created")) {
          headers.push("Created");
          row.push(dayjs(project.created).format("DD MMM YYYY").toString());
        } else if (_.isEqual(field, "owner")) {
          headers.push("Owner");
          row.push(project.owner);
        } else if (_.isEqual(field, "description")) {
          // "description" data field
          headers.push("Description");
          row.push(project.description);
        }
      }

      // Collate and format data as a CSV string
      const collated = [headers, row];
      const formatted = Papa.unparse(collated);
      return formatted;
    } else {
      return JSON.stringify(project, null, "  ");
    }
  };

  /**
   * Generate an exported file containing details of all Entities in a Project
   * @param _id Project identifier
   * @param format Exported file format
   * @return {Promise<string>}
   */
  static exportEntities = async (
    _id: string,
    format: "json",
  ): Promise<string> => {
    const project = await Projects.getOne(_id);

    if (format !== "json") {
      return "";
    }

    if (_.isNull(project)) {
      return "";
    }

    const entityData = [];
    for await (const entity of project.entities) {
      const result = await Entities.getOne(entity);

      // Remove the history component
      const entityHistoryRemoved: Partial<EntityModel> = {
        _id: result?._id,
        name: result?.name,
        timestamp: result?.timestamp,
        owner: result?.owner,
        archived: result?.archived,
        created: result?.created,
        description: result?.description,
        projects: result?.projects,
        associations: result?.associations,
        attributes: result?.attributes,
        attachments: result?.attachments,
      };

      entityData.push(entityHistoryRemoved);
    }

    return JSON.stringify(entityData, null, "  ");
  };
}
