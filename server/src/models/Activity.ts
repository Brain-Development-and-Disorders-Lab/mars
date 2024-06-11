import { getDatabase } from "src/connectors/database";

// Collection name
const ACTIVITY_COLLECTION = "activity";

export class Activity {
  /**
   * Get all Activity entries from the Activity collection
   * @returns Collection of all Activity entries
   */
  static all = async () => {
    return await getDatabase().collection(ACTIVITY_COLLECTION).find().toArray();
  };
}
