// Utility functions
import { getDatabase } from "../connection";

import { UpdateStruct } from "../../../types";

// Constants
const UPDATES_COLLECTION = "updates";

/**
 * Register an Update in the database
 * @param {UpdateStruct} update information related to an Update
 */
export const registerUpdate = (update: UpdateStruct) => {
  // Insert the new Update
  getDatabase()
    .collection(UPDATES_COLLECTION)
    .insertOne(update, (error: any, content: any) => {
      if (error) throw error;
    });
};