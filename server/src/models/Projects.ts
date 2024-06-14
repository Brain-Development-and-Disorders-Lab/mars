import { IProject, ProjectModel, ResponseMessage } from "@types";
import _ from "lodash";
import { getDatabase } from "src/connectors/database";
import { getIdentifier } from "src/util";
import { Entities } from "./Entities";
import dayjs from "dayjs";
import Papa from "papaparse";
import * as tmp from "tmp";
import * as fs from "fs";

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

  static exists = async (_id: string): Promise<boolean> => {
    const project = await this.getOne(_id);
    return _.isNull(project);
  };

  static create = async (project: IProject): Promise<ResponseMessage> => {
    // Create a `ProjectModel` instance by adding an identifier and unpacking given Project data
    const projectModel: ProjectModel = {
      _id: getIdentifier("project"),
      ...project,
    };

    const response = await getDatabase()
      .collection<ProjectModel>(PROJECTS_COLLECTION)
      .insertOne(projectModel);
    const successStatus = _.isEqual(response.insertedId, projectModel._id);

    return {
      success: successStatus,
      message: successStatus
        ? "Created new Project"
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

    if (updated.description) {
      update.$set.description = updated.description;
    }

    // Entities to add and remove
    if (updated.entities) {
      const toAdd = _.difference(updated.entities, project.entities);
      for (let entity of toAdd) {
        await Entities.addProject(entity, project._id);
      }
      const toRemove = _.difference(project.entities, updated.entities);
      for (let entity of toRemove) {
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
   * Delete a Project
   * @param _id Project identifier to delete
   * @return {ResponseMessage}
   */
  static delete = async (_id: string): Promise<ResponseMessage> => {
    const project = await Projects.getOne(_id);
    // Remove Entities from Project
    if (project) {
      for (let entity of project.entities) {
        await Entities.removeProject(entity, project._id);
      }
    }

    // Execute delete operation
    const response = await getDatabase()
      .collection<ProjectModel>(PROJECTS_COLLECTION)
      .deleteOne({ _id: _id });

    // To-Do: Create new Activity entry

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

    if (_.isEqual(format, "json")) {
      // Handle JSON format
      return JSON.stringify(project);
    } else if (_.isEqual(format, "csv")) {
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
      for (let field of exportFields) {
        console.info("Generating information for field:", field);
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
        } else if (_.isEqual(field, "entities")) {
          // "entities" data field
          headers.push("Entities");
          row.push(project.entities.join("_"));
        }
      }

      // Collate and format data as a CSV string
      const collated = [headers, row];
      const formatted = Papa.unparse(collated);

      // Create a temporary file, passing the filename as a response
      tmp.file((error, path: string, _fd: number) => {
        if (error) {
          throw error;
        }

        fs.writeFileSync(path, formatted);
      });
      return "csv";
    } else {
      return "Invalid format";
    }
  };
}
