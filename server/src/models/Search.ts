import { EntityModel, ProjectModel } from "@types";
import { getDatabase } from "../connectors/database";
import _ from "lodash";

// Models
import { Workspaces } from "./Workspaces";
import { Entities } from "./Entities";
import { Projects } from "./Projects";

// Collection names
const ENTITIES_COLLECTION = "entities";
const PROJECTS_COLLECTION = "projects";

export class Search {
  /**
   * Get a collection of Search results
   * @param {string} query Search query data
   * @param {string} resultType Search result type of either "entity" or "project"
   * @param {boolean} showArchived Include archived Entities
   * @param {string} workspace Workspace identifier
   * @returns {Promise<EntityModel[] | ProjectModel[]>}
   */
  static getText = async (
    query: string,
    resultType: string,
    showArchived: boolean,
    workspace: string,
  ): Promise<EntityModel[] | ProjectModel[]> => {
    // Sanitize database query
    query = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const expression = new RegExp(query, "gi");

    // Limit the fields returned for efficiency, default limit is 10
    const options = {
      projection: { name: 1, description: 1 },
    };

    // Execute search operation depending on whether it is searching Entities or Projects
    if (resultType === "project") {
      // Construct search query
      const databaseQuery = {
        $or: [
          { _id: { $regex: expression } },
          { name: { $regex: expression } },
          { description: { $regex: expression } },
        ],
        $and: [{}],
      };

      if (showArchived === false) {
        databaseQuery.$and.push({ archived: false });
      }

      const results = await getDatabase()
        .collection<ProjectModel>(PROJECTS_COLLECTION)
        .find(databaseQuery, options)
        .toArray();

      // Get the current Workspace context and retrieve all Projects
      const context = await Workspaces.getOne(workspace);
      if (!context) {
        return [];
      }
      const projects = await Projects.getMany(context.projects);

      // Create an intersection of the search results and all Projects
      const intersected = _.intersection<string>(
        results.map((e) => e._id),
        projects.map((e) => e._id),
      );

      // Filter the query results to only those matching the current Workspace
      return _.filter(projects, (project) =>
        _.includes(intersected, project._id),
      );
    } else {
      // Construct search query
      const databaseQuery = {
        $or: [
          { _id: { $regex: expression } },
          { name: { $regex: expression } },
          { description: { $regex: expression } },
          { "relationships.target.name": { $regex: expression } },
          { "attributes.description": { $regex: expression } },
          { "attributes.description": { $regex: expression } },
          { "attributes.values": { $regex: expression } },
          { "attributes.values.name": { $regex: expression } },
          { "attributes.values.data": { $regex: expression } }, // Assuming searchable content within attributes
        ],
        $and: [{}],
      };

      if (showArchived === false) {
        databaseQuery.$and.push({ archived: false });
      }

      const results = await getDatabase()
        .collection<EntityModel>(ENTITIES_COLLECTION)
        .find(databaseQuery, options)
        .toArray();

      // Get the current Workspace context and retrieve all Entities
      const context = await Workspaces.getOne(workspace);
      if (!context) {
        return [];
      }
      const entities = await Entities.getMany(context.entities);

      // Create an intersection of the search results and all Entities
      const intersected = _.intersection<string>(
        results.map((e) => e._id),
        entities.map((e) => e._id),
      );

      // Filter the query results to only those matching the current Workspace
      return _.filter(entities, (entity) =>
        _.includes(intersected, entity._id),
      );
    }
  };

  /**
   * Create and execute a structured MongoDB query
   * @param {string} query JSON representation of query serialized to string
   * @param {string} resultType Search result type of either "entity" or "project"
   * @param {string} workspace Target Workspace identifier
   * @return {Promise<EntityModel[] | ProjectModel[]>}
   */
  static getQuery = async (
    query: string,
    resultType: string,
    workspace: string,
  ): Promise<EntityModel[] | ProjectModel[]> => {
    // Parse the query string into a MongoDB query object
    const parsedQuery = JSON.parse(query);

    // Construct MongoDB query
    let mongoQuery = {};

    if (_.isArray(parsedQuery)) {
      // If the query is an array, assume it's an array of query conditions
      mongoQuery = { $and: parsedQuery };
    } else {
      // If it's not an array, use the query object directly
      mongoQuery = parsedQuery;
    }

    if (resultType === "project") {
      // Execute the search query with any specified options
      const results = await getDatabase()
        .collection<ProjectModel>(PROJECTS_COLLECTION)
        .find(mongoQuery)
        .toArray();

      // Get the current Workspace context and retrieve all Entities
      const context = await Workspaces.getOne(workspace);
      if (!context) {
        return [];
      }
      const projects = await Projects.getMany(context.projects);

      // Create an intersection of the search results and all Projects
      const intersected = _.intersection<string>(
        results.map((e) => e._id),
        projects.map((e) => e._id),
      );

      // Filter the query results to only those matching the current Workspace
      return _.filter(projects, (project) =>
        _.includes(intersected, project._id),
      );
    } else {
      // Execute the search query with any specified options
      const results = await getDatabase()
        .collection<EntityModel>(ENTITIES_COLLECTION)
        .find(mongoQuery)
        .toArray();

      // Get the current Workspace context and retrieve all Entities
      const context = await Workspaces.getOne(workspace);
      if (!context) {
        return [];
      }
      const entities = await Entities.getMany(context.entities);

      // Create an intersection of the search results and all Entities
      const intersected = _.intersection<string>(
        results.map((e) => e._id),
        entities.map((e) => e._id),
      );

      // Filter the query results to only those matching the current Workspace
      return _.filter(entities, (entity) =>
        _.includes(intersected, entity._id),
      );
    }
  };
}
