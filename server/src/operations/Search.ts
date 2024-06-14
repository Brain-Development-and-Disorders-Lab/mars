import consola from "consola";

// Custom types
import { QueryComponent } from "@types";

// Utility functions and libraries
// @ts-ignore
import mquery from "mquery";
import _ from "lodash";
import { getDatabase } from "../connectors/database";
import { Entities } from "./Entities";

const ENTITIES = "entities";

export class Search {
  /**
   * Get a collection of Search results
   * @param data Search query data
   * @returns {Promise<any[]>}
   */
  static get = (data: { query: string }): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      // Sanitize database query
      data.query = data.query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const expression = new RegExp(data.query, "gi");

      getDatabase()
        .collection(ENTITIES)
        .find({
          $or: [
            { _id: { $regex: expression } },
            { name: { $regex: expression } },
            { owner: { $regex: expression } },
            { description: { $regex: expression } },
            { "associations.origins.name": { $regex: expression } },
            { "attributes.description": { $regex: expression } },
            { "attributes.description": { $regex: expression } },
            { "attributes.values": { $regex: expression } },
            { "attributes.values.name": { $regex: expression } },
            { "attributes.values.identifier": { $regex: expression } },
            { "attributes.values.data": { $regex: expression } },
          ],
        })
        .toArray((error, content) => {
          // Check for errors
          if (error) {
            consola.error("Error while searching:", error);
            reject(error);
          }

          // Reset to empty array if undefined
          if (_.isUndefined(content)) {
            content = [];
          }

          consola.debug("Searched:", data.query);
          resolve(content);
        });
    });
  };

  /**
   * Get a list of search results using a query generated from the query builder
   * @param data Seach query built using query builder
   * @returns {Promise<any[]>}
   */
  static getBuiltQuery = (data: { query: string }): Promise<any[]> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Parse the query string into a MongoDB query object
        const queryObject = JSON.parse(data.query);

        // Construct MongoDB query
        let mongoQuery = {};

        // Search for Origin
        if (queryObject.origin) {
          let originEntity = await Entities.getOne(queryObject.origin);
          delete queryObject.origin;
          if (originEntity) {
            queryObject["associations.origins"] = {
              $elemMatch: { id: originEntity._id.toString() },
            };
          }
        }

        // Search for Product
        if (queryObject.product) {
          let productEntity = await Entities.getOne(queryObject.product);
          delete queryObject.product;
          if (productEntity) {
            queryObject["associations.products"] = {
              $elemMatch: { id: productEntity._id.toString() },
            };
          }
        }

        if (_.isArray(queryObject)) {
          // If the query is an array, assume it's an array of query conditions
          mongoQuery = { $and: queryObject };
        } else {
          // If it's not an array, use the query object directly
          mongoQuery = queryObject;
        }

        // Perform the MongoDB query
        getDatabase()
          .collection(ENTITIES)
          .find(mongoQuery)
          .toArray((error, content) => {
            if (error) {
              consola.error("Error while performing search:", error);
              reject(error);
              return;
            }

            // Reset to empty array if undefined
            if (_.isUndefined(content)) {
              content = [];
            }

            consola.debug("Searched with Built Query:", data.query);
            resolve(content);
          });
      } catch (error) {
        consola.error("Error parsing or executing query:", error);
        reject(error);
      }
    });
  };

  /**
   * @deprecated
   * Legacy search query function using homebrewed search query builder
   * @param data Search query data
   * @returns {Promise<any[]>}
   */
  static getQuery = (data: { query: string }): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const queryComponents = JSON.parse(data.query) as QueryComponent[];

      if (queryComponents.length > 1) {
        queryComponents[0].operator = queryComponents[1].operator;
      }

      // Generate component groupings
      const queryLogicalGroups = {
        AND: queryComponents.filter((component) => {
          return _.isEqual(component.operator, "AND");
        }),
        OR: queryComponents.filter((component) => {
          return _.isEqual(component.operator, "OR");
        }),
      };

      // Generate logical operations
      const queryLogicalOperations = {
        AND: () => {
          let queryBase = mquery().find();
          const expressions = [];
          for (let component of queryLogicalGroups.AND) {
            const qualifier = component.qualifier.toLowerCase();
            const subQualifier = component.subQualifier?.toLowerCase();
            const parameter = component.parameter.toLowerCase();

            if (_.includes(["description", "name"], parameter)) {
              // Parameters: name, description
              if (_.isEqual(qualifier, "is")) {
                expressions.push({ [parameter]: component.value });
              } else if (_.isEqual(qualifier, "is not")) {
                expressions.push({ [parameter]: { $ne: component.value } });
              } else if (_.isEqual(qualifier, "contains")) {
                expressions.push({
                  [parameter]: {
                    $regex: new RegExp(`${component.value}`, "gi"),
                  },
                });
              } else if (_.isEqual(qualifier, "does not contain")) {
                expressions.push({
                  $nor: [
                    {
                      [parameter]: {
                        $regex: new RegExp(`${component.value}`, "gi"),
                      },
                    },
                  ],
                });
              }
            } else if (_.isEqual(parameter, "projects")) {
              // Parameters: projects
              if (_.isEqual(qualifier, "contains")) {
                expressions.push({ [parameter]: { $in: [component.key] } });
              } else if (_.isEqual(qualifier, "does not contain")) {
                expressions.push({
                  $nor: [{ [parameter]: { $in: [component.key] } }],
                });
              }
            } else if (_.includes(["origins", "products"], parameter)) {
              // Parameters: origins, products
              if (_.isEqual(qualifier, "contains")) {
                expressions.push({
                  [`associations.${parameter}`]: {
                    $elemMatch: { id: { $in: [component.key] } },
                  },
                });
              } else if (_.isEqual(qualifier, "does not contain")) {
                expressions.push({
                  $nor: [
                    {
                      [`associations.${parameter}`]: {
                        $elemMatch: { id: { $in: [component.key] } },
                      },
                    },
                  ],
                });
              }
            } else if (_.isEqual(parameter, "attributes")) {
              // Parameters: attributes
              if (_.isEqual(qualifier, "contains")) {
                if (_.isEqual(subQualifier, "entity")) {
                  // Check exact match for "Entity"
                  expressions.push({
                    [`attributes.values.data`]: {
                      $in: [component.key],
                    },
                  });
                } else {
                  // General fuzzy match
                  expressions.push({
                    [`attributes.values.data`]: {
                      $regex: new RegExp(`^${component.key}*`, "gi"),
                    },
                  });
                }
              } else if (_.isEqual(qualifier, "does not contain")) {
                if (_.isEqual(subQualifier, "entity")) {
                  // Check exact match for "Entity"
                  expressions.push({
                    $nor: [
                      {
                        [`attributes.values.data`]: {
                          $in: [component.key],
                        },
                      },
                    ],
                  });
                } else {
                  // General fuzzy match
                  expressions.push({
                    $nor: [
                      {
                        [`attributes.values.data`]: {
                          $regex: new RegExp(`^${component.key}*`, "gi"),
                        },
                      },
                    ],
                  });
                }
              }
            }
          }
          return queryBase.and(expressions);
        },
        OR: () => {
          let queryBase = mquery().find();
          const expressions = [];
          for (let component of queryLogicalGroups.OR) {
            const qualifier = component.qualifier.toLowerCase();
            const parameter = component.parameter.toLowerCase();

            if (_.includes(["description", "name"], parameter)) {
              if (_.isEqual(qualifier, "is")) {
                expressions.push({ [parameter]: component.value });
              } else if (_.isEqual(qualifier, "is not")) {
                expressions.push({ [parameter]: { $ne: component.value } });
              } else if (_.isEqual(qualifier, "contains")) {
                expressions.push({
                  [parameter]: { $regex: new RegExp(component.value, "gi") },
                });
              } else if (_.isEqual(qualifier, "does not contain")) {
                expressions.push({
                  [parameter]: {
                    $regex: new RegExp(`^((?!${component.value}).)*$`, "gi"),
                  },
                });
              }
            } else if (_.isEqual(parameter, "projects")) {
              // Parameters: projects
              if (_.isEqual(qualifier, "contains")) {
                expressions.push({ [parameter]: { $in: [component.key] } });
              } else if (_.isEqual(qualifier, "does not contain")) {
                expressions.push({ [parameter]: { $nin: [component.key] } });
              }
            } else if (_.includes(["origins", "products"], parameter)) {
              // Parameters: origins, products
              if (_.isEqual(qualifier, "contains")) {
                expressions.push({
                  [`associations.${parameter}`]: {
                    $elemMatch: { id: { $in: [component.key] } },
                  },
                });
              } else if (_.isEqual(qualifier, "does not contain")) {
                expressions.push({
                  [`associations.${parameter}`]: {
                    $not: { $elemMatch: { id: { $in: [component.key] } } },
                  },
                });
              }
            } else if (_.isEqual(parameter, "attributes")) {
              // Parameters: attributes
              if (_.isEqual(qualifier, "contains")) {
                expressions.push({
                  [`attributes.values.data`]: {
                    $regex: new RegExp(component.value, "gi"),
                  },
                });
              } else if (_.isEqual(qualifier, "does not contain")) {
                expressions.push({
                  [`attributes.values.data`]: {
                    $regex: new RegExp(`^((?!${component.value}).)*$`, "gi"),
                  },
                });
              }
            }
          }
          return queryBase.or(expressions);
        },
      };

      const collection = getDatabase().collection(ENTITIES);
      if (_.isEmpty(queryLogicalGroups.AND)) {
        // Only 'OR' query components
        queryLogicalOperations
          .OR()
          .collection(collection)
          .exec()
          .then((result: any[]) => {
            consola.debug(
              "Searched:",
              queryComponents.length,
              "OR query components",
            );
            resolve(result);
          })
          .catch((error: any) => {
            consola.error("Error while searching for 'OR' components:", error);
            reject(error);
          });
      } else if (_.isEmpty(queryLogicalGroups.OR)) {
        // Only 'AND' query components
        queryLogicalOperations
          .AND()
          .collection(collection)
          .exec()
          .then((result: any[]) => {
            consola.debug(
              "Searched:",
              queryComponents.length,
              "AND query components",
            );
            resolve(result);
          })
          .catch((error: any) => {
            consola.error("Error while searching for 'AND' components:", error);
            reject(error);
          });
      } else {
        // Both 'AND' and 'OR' query components
        Promise.all([
          // Evaluate the 'AND' components
          queryLogicalOperations.AND().collection(collection).exec(),
          // Evaluate the 'OR' components
          queryLogicalOperations.OR().collection(collection).exec(),
        ])
          .then(([resultAND, resultOR]) => {
            // Join the results
            consola.debug(
              "Searched:",
              queryComponents.length,
              "query components",
            );

            // Resolve by unique results
            resolve(_.uniqBy([...resultAND, ...resultOR], "_id"));
          })
          .catch((error: any) => {
            consola.error(
              "Error while searching for both 'AND' and 'OR' components:",
              error,
            );
            reject(error);
          });
      }
    });
  };
}
