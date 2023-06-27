import consola from "consola";

// Custom types
import { QueryComponent } from "@types";

// Utility functions and libraries
import mquery from "mquery";
import { getDatabase } from "src/database/connection";
import _ from "lodash";

const ENTITIES_COLLECTION = "entities";

export class Search {
  static get = (data: { query: string }): Promise<any[]> => {
    consola.start("Search:", data.query);
    return new Promise((resolve, reject) => {
      // Sanitize database query
      data.query = data.query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const expression = new RegExp(data.query, "gi");

      getDatabase()
        .collection(ENTITIES_COLLECTION)
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
            reject(error);
          }

          // Reset to empty array if undefined
          if (_.isUndefined(content)) {
            content = [];
          }

          consola.success("Searched:", data.query);
          resolve(content);
        });
    });
  };

  static getQuery = (data: { query: string }): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const queryComponents = JSON.parse(data.query) as QueryComponent[];
      consola.start("Searching:", queryComponents.length, "query components");

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
            const parameter = component.parameter.toLowerCase();
            if (_.isEqual(qualifier, "is")) {
              expressions.push({ [parameter]: component.value });
            } else if (_.isEqual(qualifier, "is not")) {
              expressions.push({ [parameter]: { $ne: component.value } });
            } else if (_.isEqual(qualifier, "contains")) {
              expressions.push({ [parameter]: { $regex: new RegExp(component.value, "gi") } });
            } else if (_.isEqual(qualifier, "does not contain")) {
              expressions.push({ [parameter]: { $regex: new RegExp(`^((?!${component.value}).)*$`, "gi") } });
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
            if (_.isEqual(qualifier, "is")) {
              expressions.push({ [parameter]: component.value });
            } else if (_.isEqual(qualifier, "is not")) {
              expressions.push({ [parameter]: { $ne: component.value } });
            } else if (_.isEqual(qualifier, "contains")) {
              expressions.push({ [parameter]: { $regex: new RegExp(component.value, "gi") } });
            } else if (_.isEqual(qualifier, "does not contain")) {
              expressions.push({ [parameter]: { $regex: new RegExp(`^((?!${component.value}).)*$`, "gi") } });
            }
          }
          return queryBase.or(expressions);
        }
      };

      const collection = getDatabase().collection(ENTITIES_COLLECTION);
      if (_.isEmpty(queryLogicalGroups.AND)) {
        // Only 'OR' query components
        queryLogicalOperations.OR().collection(collection).exec().then((result: any[]) => {
          consola.success("Searched:", queryComponents.length, "OR query components");
          resolve(result);
        }).catch((error: any) => {
          reject(error);
        });
      } else if (_.isEmpty(queryLogicalGroups.OR)) {
        // Only 'AND' query components
        queryLogicalOperations.AND().collection(collection).exec().then((result: any[]) => {
          consola.success("Searched:", queryComponents.length, "AND query components");
          resolve(result);
        }).catch((error: any) => {
          reject(error);
        });
      } else {
        // Both 'AND' and 'OR' query components
        Promise.all([
          // Evaluate the 'AND' components
          queryLogicalOperations.AND().collection(collection).exec(),
          // Evaluate the 'OR' components
          queryLogicalOperations.OR().collection(collection).exec(),
        ]).then(([resultAND, resultOR]) => {
          // Join the results
          consola.success("Searched:", queryComponents.length, "query components");

          // Resolve by unique results
          resolve(_.uniqBy([...resultAND, ...resultOR], "_id"));
        }).catch((error: any) => {
          reject(error);
        });
      }
    });
  };
}
