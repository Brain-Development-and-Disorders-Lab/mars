// Custom types
import { ActivityModel, IActivity, ResponseData } from "@types";

// Utility functions and libraries
import { getIdentifier } from "@lib/util";
import { getDatabase } from "@connectors/database";
import _ from "lodash";
import consola from "consola";

// Collection name
const ACTIVITY_COLLECTION = "activity";

export class Activity {
  /**
   * Get all Activity entries from the Activity collection
   * @returns Collection of all Activity entries
   */
  static all = async (): Promise<ActivityModel[]> => {
    consola.debug("Retrieving all Activity...");
    return await getDatabase()
      .collection<ActivityModel>(ACTIVITY_COLLECTION)
      .find()
      .sort({ timestamp: -1 })
      .toArray();
  };

  /**
   * Get multiple Activity entries (specified by ID) from the Activity collection
   * @param activities Collection of multiple Activity entries
   */
  static getMany = async (activities: string[]): Promise<ActivityModel[]> => {
    consola.debug(`Retrieving ${activities.length} Activity entries...`);
    return await getDatabase()
      .collection<ActivityModel>(ACTIVITY_COLLECTION)
      .find({ _id: { $in: activities } })
      .sort({ timestamp: -1 })
      .toArray();
  };

  /**
   * Create a new Activity entry
   * @param activity Activity data
   * @return {IResponseMessage}
   */
  static create = async (
    activity: IActivity,
  ): Promise<ResponseData<string>> => {
    consola.debug(`Creating new Activity entry...`);
    const activityModel: ActivityModel = {
      _id: getIdentifier("activity"),
      ...activity,
    };

    consola.debug("Activity:", activityModel.type, activityModel.target._id);

    const response = await getDatabase()
      .collection<ActivityModel>(ACTIVITY_COLLECTION)
      .insertOne(activityModel);

    const successStatus = _.isEqual(response.insertedId, activityModel._id);
    if (!successStatus) {
      consola.error(
        "Unable to create new Activity entry:",
        activityModel.type,
        activityModel.target._id,
      );
    }

    return {
      success: successStatus,
      message: successStatus ? "Created Activity" : "Unable to create Activity",
      data: response.insertedId.toString(),
    };
  };
}
