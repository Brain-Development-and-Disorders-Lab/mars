import consola from "consola";

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
}
