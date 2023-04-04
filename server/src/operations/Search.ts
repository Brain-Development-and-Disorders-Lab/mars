import consola from "consola";

import { getDatabase } from "src/database/connection";
import _ from "underscore";

const ENTITIES_COLLECTION = "entities";

export class Search {
  static get = (query: string): Promise<any[]> => {
    consola.info("Search:", query);
    return new Promise((resolve, reject) => {
      // Configure database query
      const find = { $text: { $search: query } };
      const sort = { score: { $meta: "textScore" } };

      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .find(find)
        .sort(sort)
        .toArray((error, content) => {
          // Check for errors
          if (error) {
            reject(error);
          }

          // Reset to empty array if undefined
          if (_.isUndefined(content)) {
            content = [];
          }

          consola.success("Searched:", query);
          resolve(content);
        });
    });
  };
}
