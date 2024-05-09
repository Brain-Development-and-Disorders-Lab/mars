import { getDatabase } from "src/connectors/database";

// Collection name
const ATTRIBUTES_COLLECTION = "attributes";

export class Attributes {
  /**
   * Get all Attribute entries from the Attributes collection
   * @returns Collection of all Attribute entries
   */
  static all = async () => {
    return await getDatabase()
      .collection(ATTRIBUTES_COLLECTION)
      .find()
      .toArray();
  }
};
