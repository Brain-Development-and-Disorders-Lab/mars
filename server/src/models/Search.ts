import { EntityModel } from "@types";
import { getDatabase } from "../connectors/database";
import _ from "lodash";
import { Workspaces } from "./Workspaces";
import { Entities } from "./Entities";

// Collection name
const ENTITIES_COLLECTION = "entities";

export class Search {
  /**
   * Get a collection of Search results
   * @param {string} query Search query data
   * @param {string} workspace Workspace identifier
   * @param {boolean} showArchived Include archived Entities
   * @returns {Promise<EntityModel[]>}
   */
  static getText = async (
    query: string,
    workspace: string,
    showArchived: boolean,
  ): Promise<EntityModel[]> => {
    // Sanitize database query
    query = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const expression = new RegExp(query, "gi");

    // Limit the fields returned for efficiency, default limit is 10
    const options = {
      projection: { name: 1, description: 1 },
    };

    // Construct search query
    const databaseQuery = {
      $or: [
        { _id: { $regex: expression } },
        { name: { $regex: expression } },
        { description: { $regex: expression } },
        { "associations.origins.name": { $regex: expression } },
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
    return _.filter(entities, (entity) => _.includes(intersected, entity._id));
  };

  static getQuery = async (
    query: string,
    workspace: string,
  ): Promise<EntityModel[]> => {
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
    return _.filter(entities, (entity) => _.includes(intersected, entity._id));
  };
}
