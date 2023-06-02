// Utility functions
import { getDatabase } from "../database/connection";
import consola from "consola";

import { UpdateModel, IUpdate } from "@types";

// Constants
const UPDATES = "updates";

export class Updates {
  /**
   * Create a new Update to record in the database
   * @param {Update} update data related to the Update
   * @return {Promise<Update>}
   */
  static create = (update: IUpdate): Promise<IUpdate> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(UPDATES)
        .insertOne(update, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          consola.success("Created Update:", update.target.name);
          resolve(result as IUpdate);
        });
    });
  };

  /**
   * Retrieve all Updates
   * @return {Promise<UpdateModel[]>}
   */
  static getAll = (): Promise<UpdateModel[]> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(UPDATES)
        .find({})
        .toArray((error: any, result: any) => {
          if (error) {
            throw error;
          }

          consola.success("Retrieved all Updates");
          resolve(result as UpdateModel[]);
        });
    });
  };
}
