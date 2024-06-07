import { DeviceModel } from "@types";

// Utility functions and libraries
import _ from "lodash";
import { consola } from "consola";

// Database operations
import { getSystem } from "../database/connection";

// Constants
const DEVICES = "devices";

export class System {
  /**
   * Retrieve information about a device associated with the system
   * @param id Target device identifier
   * @returns {Promise<DeviceModel>}
   */
  static getDevice = (id: string): Promise<DeviceModel> => {
    return new Promise((resolve, reject) => {
      getSystem()
        .collection(DEVICES)
        .findOne({ _id: id }, (error: any, result: any) => {
          if (error) {
            consola.error("Error while retrieving device:", error);
            reject(error);
            throw error;
          }

          consola.debug("Retrieved device:", id.toString());
          resolve(result as DeviceModel);
        });
    });
  };

  /**
   * Retrieve a collection of all devices associated with the system
   * @returns {Promise<DeviceModel[]>}
   */
  static getDevices = (): Promise<DeviceModel[]> => {
    return new Promise((resolve, reject) => {
      getSystem()
        .collection(DEVICES)
        .find({})
        .toArray((error: any, result: any) => {
          if (error) {
            consola.error("Error while retrieving devices:", error);
            reject(error);
            throw error;
          }

          consola.debug("Retrieved", result.length, "devices");
          resolve(result as DeviceModel[]);
        });
    });
  };
}
