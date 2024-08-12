import { EntityModel } from "@types";
import { getDatabase } from "../connectors/database";
import _ from "lodash";

// Collection name
const ENTITIES_COLLECTION = "entities";

export class Search {
  /**
   * Get a collection of Search results
   * @param {string} query Search query data
   * @returns {Promise<EntityModel[]>}
   */
  static getText = async (
    query: string,
    user: string,
    limit: number = 5,
  ): Promise<EntityModel[]> => {
    // Sanitize database query
    query = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const expression = new RegExp(query, "gi");

    // Limit the fields returned for efficiency
    const options = {
      limit: limit,
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
      $and: [
        { deleted: false },
        { $or: [{ owner: user }, { collaborators: user }] }, // Ensure user is owner or collaborator
      ],
    };

    return await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .find(databaseQuery, options)
      .toArray();
  };

  static getQuery = async (
    query: string,
    user: string,
    limit: number = 5,
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

    // Limit the fields returned for efficiency
    const options = {
      limit: limit,
    };

    // To-Do: Ensure we restrict by user

    // Perform the MongoDB query
    return await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .find(mongoQuery, options)
      .toArray();
  };
}
