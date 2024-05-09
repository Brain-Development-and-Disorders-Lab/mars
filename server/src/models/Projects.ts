import { getDatabase } from "src/connectors/database";

// Collection name
const PROJECTS_COLLECTION = "projects";

export class Projects {
  /**
   * Get all Project entries from the Projects collection
   * @returns Collection of all Project entries
   */
  static all = async () => {
    return await getDatabase()
      .collection(PROJECTS_COLLECTION)
      .find()
      .toArray();
  }
};
