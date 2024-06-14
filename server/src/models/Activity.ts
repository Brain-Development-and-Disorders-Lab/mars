import { ActivityModel, IActivity, ResponseMessage } from "@types";
import { getDatabase } from "src/connectors/database";

// Collection name
const ACTIVITY_COLLECTION = "activity";

export class Activity {
  /**
   * Get all Activity entries from the Activity collection
   * @returns Collection of all Activity entries
   */
  static all = async (): Promise<ActivityModel[]> => {
    return await getDatabase()
      .collection<ActivityModel>(ACTIVITY_COLLECTION)
      .find()
      .toArray();
  };

  /**
   * Create a new Activity entry
   * @param activity Activity data
   * @return {ResponseMessage}
   */
  static create = async (activity: IActivity): Promise<ResponseMessage> => {
    const response = await getDatabase()
      .collection(ACTIVITY_COLLECTION)
      .insertOne(activity);

    return {
      success: response.acknowledged,
      message: response.acknowledged
        ? "Created Activity successfully"
        : "Unable to create Activity",
    };
  };
}
