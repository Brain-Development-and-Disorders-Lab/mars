// Utility functions
import { getDatabase } from "../database/connection";
import consola from "consola";

import { ActivityModel, IActivity } from "@types";

// Constants
const ACTIVITY = "activity";

export class Activity {
  /**
   * Create a new Update to record in the database
   * @param {IActivity} activity data related to the Update
   * @return {Promise<IActivity>}
   */
  static create = (activity: IActivity): Promise<IActivity> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ACTIVITY)
        .insertOne(activity, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          consola.debug("Activity:", activity.target.name);
          resolve(result as IActivity);
        });
    });
  };

  /**
   * Retrieve all Activity
   * @return {Promise<ActivityModel[]>}
   */
  static getAll = (): Promise<ActivityModel[]> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ACTIVITY)
        .find({})
        .toArray((error: any, result: any) => {
          if (error) {
            throw error;
          }

          consola.debug("Retrieved all Activity");
          resolve(result as ActivityModel[]);
        });
    });
  };
}
