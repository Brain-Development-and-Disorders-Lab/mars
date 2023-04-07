import consola from "consola";

import { getDatabase } from "src/database/connection";
import _ from "underscore";

const ENTITIES_COLLECTION = "entities";

export class Search {
  static get = (data: { query: string }): Promise<any[]> => {
    consola.info("Search:", data.query);
    return new Promise((resolve, reject) => {
      // Sanitize database query
      data.query = data.query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .find({
          $or: [
            { name: { $regex: new RegExp(data.query, "gi") }, },
            { description: { $regex: new RegExp(data.query, "gi") }, },
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
