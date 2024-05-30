import { IProject, ProjectModel, ResponseMessage } from "@types";
import _ from "lodash";
import { getDatabase } from "src/connectors/database";
import { getIdentifier } from "src/util";
import { Entities } from "./Entities";

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
  }

  static getOne = async (_id: string) => {
    return await getDatabase()
      .collection<ProjectModel>(PROJECTS_COLLECTION)
      .findOne({ _id: _id });
  }

  static create = async (project: IProject):  Promise<ResponseMessage> => {
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
      message: successStatus ? "Created new Project": "Could not create new Project",
    };
  }

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
        ...project
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
      message: successStatus ? "Updated Project": "Could not update Project",
    };
  };

  static addEntity = async (_id: string, entity: string): Promise<ResponseMessage> => {
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
      message: successStatus ? "Added Entity to Project" : "Could not add Entity to Project",
    };
  }

  static addEntities = async (_id: string, entities: string[]): Promise<ResponseMessage> => {
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
      message: successStatus ? "Added Entities to Project" : "Could not add Entities to Project",
    };
  }

  static removeEntity = async (_id: string, entity: string): Promise<ResponseMessage> => {
    const project = await this.getOne(_id);

    if (_.isNull(project)) {
      return {
        success: false,
        message: "Project does not exist",
      };
    }

    const entityCollection = project.entities;
    _.remove(entityCollection, entity);

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
      message: successStatus ? "Removed Entity from Project" : "Could not remove Entity from Project",
    };
  }
};
