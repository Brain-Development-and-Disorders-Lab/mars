// Utility functions
import { getDatabase } from "../database/connection";
import consola from "consola";

import { ActivityModel, IActivity } from "@types";
import _ from "lodash";

// Constants
const ACTIVITY = "activity";

export class Activity {
  /**
   * Create a new Update to record in the database
   * @param {IActivity} activity data related to the Update
   * @return {Promise<Update>}
   */
  static create = (activity: IActivity): Promise<IActivity> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ACTIVITY)
        .insertOne(activity, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          consola.success("Activity:", activity.target.name);
          resolve(result as IActivity);
        });
    });
  };

  /**
   * Retrieve all Activity
   * @param limit {number} optional parameter to limit the number
   * of results returned
   * @return {Promise<ActivityModel[]>}
   */
  static getAll = (limit?: number): Promise<ActivityModel[]> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ACTIVITY)
        .find({})
        .toArray((error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Reverse the result, and slice to limit if provided
          let returned: ActivityModel[] = _.reverse(result);
          returned = _.slice(returned, 0, limit);

          consola.success("Retrieved Activity");
          resolve(returned);
        });
    });
  };
}
