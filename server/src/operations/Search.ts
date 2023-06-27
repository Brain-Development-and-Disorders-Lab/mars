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
    consola.start("Search Query:", data.query);
    return new Promise((resolve, reject) => {
      const queryComponents = JSON.parse(data.query) as QueryComponent[];

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
          for (let component of queryLogicalGroups.AND) {
            const qualifier = component.qualifier.toLowerCase();
            const parameter = component.parameter.toLowerCase();

            if (_.isEqual(qualifier, "is")) {
              queryBase = queryBase.where({ [parameter]: component.value });
            } else if (_.isEqual(qualifier, "is not")) {
              queryBase = queryBase.where(parameter).ne(component.value);
            } else if (_.isEqual(qualifier, "contains")) {
              queryBase = queryBase.where(parameter).regex(new RegExp(component.value, "gi"));
            } else if (_.isEqual(qualifier, "does not contain")) {
              queryBase = queryBase.where(parameter).regex(new RegExp(`^((?!${component.value}).)*$`, "gi"));
            }
          }

          return queryBase.collection(collection);
        },
        OR: () => {

        }
      };

      const collection = getDatabase().collection(ENTITIES_COLLECTION);
      queryLogicalOperations.AND().exec().then((result: any[]) => {
        consola.success("Searched:", queryComponents.length, "Query components");
        resolve(result);
      }).catch((error: any) => {
        reject(error);
      });
    });
  };
}
