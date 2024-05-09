import { getDatabase } from "src/connectors/database";

// Collection name
const ENTITIES_COLLECTION = "entities";

export class Entities {
  /**
   * Get all Entity entries from the Entities collection
   * @returns Collection of all Entity entries
   */
  static all = async () => {
    return await getDatabase()
      .collection(ENTITIES_COLLECTION)
      .find()
      .toArray();
  }
};
