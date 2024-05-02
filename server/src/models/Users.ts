import { getDatabase } from "src/connectors/database";

// Collection name
const USERS_COLLECTION = "users";

export class Users {
  /**
   * Get all User entries from the Users collection
   * @returns Collection of all User entries
   */
  static all = async () => {
    return await getDatabase()
      .collection(USERS_COLLECTION)
      .find()
      .toArray();
  }
};
