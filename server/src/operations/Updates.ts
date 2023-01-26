// Utility functions
import { getDatabase } from "../database/connection";

import { UpdateStruct } from "@types";

// Constants
const UPDATES = "updates";

/**
 * Register an Update in the database
 * @param {UpdateStruct} update information related to an Update
 */
export const registerUpdate = (update: UpdateStruct) => {
  getDatabase()
    .collection(UPDATES)
    .insertOne(update, (error: any, _content: any) => {
      if (error) {
        throw error;
      }
    });
};