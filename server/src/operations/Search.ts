import consola from "consola";

import { getDatabase } from "src/database/connection";
import _ from "lodash";

// QueryEngine
import { QueryEngine } from "src/queries/engine";
import { Query } from "@types";

const ENTITIES_COLLECTION = "entities";

export class Search {
  static get = (data: { query: string }): Promise<any[]> => {
    consola.start("Search:", data.query);
    return new Promise((resolve, reject) => {
      // Sanitize database query
      data.query = data.query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const expression = new RegExp(data.query, "gi");

      // For testing purposes, will be passed to QueryEngine
      const QueryStruct: Query = {
        raw: data.query,
        tokens: [],
      };
      const updatedQuery = QueryEngine.tokenize(QueryStruct);
      consola.info("Tokenized query:", updatedQuery.tokens);

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
