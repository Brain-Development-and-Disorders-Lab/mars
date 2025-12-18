// Utility libraries and functions
import { getDatabase } from "../connectors/database";
import _ from "lodash";

// Models
import { EntityModel, ProjectModel } from "@types";
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
   * @param {object} filters Optional Entity filters
   * @param {string} workspace Workspace identifier
   * @returns {Promise<EntityModel[] | ProjectModel[]>}
   */
  static getText = async (
    query: string,
    resultType: string,
    showArchived: boolean,
    filters:
      | {
          startDate?: string;
          endDate?: string;
          owners?: string[];
          hasAttachments?: boolean;
          hasAttributes?: boolean;
          hasRelationships?: boolean;
          attributeCountRanges?: string[];
        }
      | undefined,
    workspace: string,
  ): Promise<EntityModel[] | ProjectModel[]> => {
    // Sanitize database query
    query = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const expression = new RegExp(query, "gi");

    // Limit the fields returned for efficiency, default limit is 10
    const options = {
      projection: { name: 1, description: 1 },
    };

    // List of results prior to prioritization
    let unprioritizedResults = [];

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
      unprioritizedResults = _.filter(projects, (project) =>
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
      let filteredResults = _.filter(entities, (entity) =>
        _.includes(intersected, entity._id),
      );

      // Apply optional Entity filters
      if (filters) {
        // Date range (created)
        if (filters.startDate || filters.endDate) {
          const startDate = filters.startDate
            ? new Date(filters.startDate)
            : undefined;
          const endDate = filters.endDate
            ? new Date(filters.endDate)
            : undefined;
          if (endDate) {
            endDate.setHours(23, 59, 59, 999);
          }

          filteredResults = filteredResults.filter((entity) => {
            if (!entity.created) return false;
            const createdDate = new Date(entity.created);
            if (startDate && createdDate < startDate) return false;
            if (endDate && createdDate > endDate) return false;
            return true;
          });
        }

        // Has attachments
        if (filters.hasAttachments === true) {
          filteredResults = filteredResults.filter(
            (entity) => entity.attachments && entity.attachments.length > 0,
          );
        }

        // Has attributes
        if (filters.hasAttributes === true) {
          filteredResults = filteredResults.filter(
            (entity) => entity.attributes && entity.attributes.length > 0,
          );
        }

        // Has relationships
        if (filters.hasRelationships === true) {
          filteredResults = filteredResults.filter(
            (entity) => entity.relationships && entity.relationships.length > 0,
          );
        }
      }

      unprioritizedResults = filteredResults;
    }

    // Re-sort the results to place the results into prioritized categories:
    // 1. Starts with: Name starts with search query
    // 2. Name includes: Name does not start with but includes search query
    // 3. Description includes: Search query appears in description only
    // 4. Other: Search query appears elsewhere in the Entity
    const comparator = _.lowerCase(query);

    // Partial collections for results
    let resultNameStartsWith = [];
    let resultNameIncludes = [];
    let resultDescriptionIncludes = [];
    let resultOther = [];

    // Iterate through collection of intersected and filtered results
    while (unprioritizedResults.length > 0) {
      // Get the last result
      const entity = unprioritizedResults.pop();
      if (_.isUndefined(entity)) break;

      // Extract parameters and set uniform case
      const name = _.lowerCase(entity.name);
      const description = _.lowerCase(entity.description);

      if (_.startsWith(name, comparator)) {
        resultNameStartsWith.push(entity);
      } else if (_.includes(name, comparator)) {
        resultNameIncludes.push(entity);
      } else if (_.includes(description, query)) {
        resultDescriptionIncludes.push(entity);
      } else {
        resultOther.push(entity);
      }
    }

    // Sort the collections by name
    resultNameStartsWith = _.sortBy(resultNameStartsWith, "name");
    resultNameIncludes = _.sortBy(resultNameIncludes, "name");
    resultDescriptionIncludes = _.sortBy(resultDescriptionIncludes, "name");
    resultOther = _.sortBy(resultOther, "name");

    // Return the prioritized results
    if (resultType === "project") {
      return [
        ...resultNameStartsWith,
        ...resultNameIncludes,
        ...resultDescriptionIncludes,
        ...resultOther,
      ] as ProjectModel[];
    } else {
      return [
        ...resultNameStartsWith,
        ...resultNameIncludes,
        ...resultDescriptionIncludes,
        ...resultOther,
      ] as EntityModel[];
    }
  };

  /**
   * Helper function to traverse an object and call a callback function for each key
   * @param object Object to traverse
   * @param callback Callback function to call for each key
   */
  private static traverseQueryObject = (
    object: any,
    callback: (key: any, value: any) => void,
  ) => {
    const stack = [object];

    while (stack.length > 0) {
      let current = stack.pop();

      if (typeof current === "object" && current !== null) {
        if (Array.isArray(current)) {
          // Handle array case
          current.forEach((item, index) => {
            // Modify the value in-place
            current[index] = callback(index, item);
            stack.push(current[index]);
          });
        } else {
          // Handle object case
          for (const key in current) {
            if (Object.prototype.hasOwnProperty.call(current, key)) {
              // Modify the value in-place
              current[key] = callback(key, current[key]);
              stack.push(current[key]);
            }
          }
        }
      } else {
        // Apply the callback to non-object values
        current = callback(current, current);
      }
    }
  };

  /**
   * Helper function to parse a JSON-serialized query into a MongoDB query
   * @param {string} query JSON-serialized query
   * @return {Record<string, any>} MongoDB query
   */
  private static generateMongoQuery = (query: any): Record<string, any> => {
    // Parse the query if it is a string, typically the case if only one rule is provided
    const parsedQuery = _.isObject(query) ? query : JSON.parse(query);

    // Traverse the query object and modify the values as necessary
    Search.traverseQueryObject(parsedQuery, (key: any, value: any) => {
      // Handle case where value is a JSON string
      if (_.isString(value) && value.startsWith("{") && value.endsWith("}")) {
        value = JSON.parse(value);
      }

      // Handle case where key is `$regex`
      if (_.isString(key) && key === "$regex" && key !== value) {
        const [pattern, flags] = value
          .slice(value.startsWith("/") ? 1 : 0)
          .split("/");
        value = new RegExp(pattern, flags);
      }

      return value;
    });

    // Construct and return the MongoDB query
    if (_.isArray(parsedQuery)) {
      // If the query is an array, assume it's an array of query conditions
      return { $and: parsedQuery };
    } else {
      // If it's not an array, use the query object directly
      return parsedQuery;
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
    const mongoQuery: Record<string, any> =
      Search.generateMongoQuery(parsedQuery);

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
