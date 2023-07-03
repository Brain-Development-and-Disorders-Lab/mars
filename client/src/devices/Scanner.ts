// Custom types
import { getData } from "@database/functions";
import { DeviceModel, ScannerStatus } from "@types";

// Utility functions and libraries
import { consola } from "consola";
import _ from "lodash";

export const connectScanner = (
  setScannerStatus: React.Dispatch<React.SetStateAction<ScannerStatus>>
): Promise<any> => {
  return new Promise((resolve, reject) => {
    getData(`/system/devices`).then((devices: DeviceModel[]) => {
      const deviceFilters = devices.map((device: DeviceModel) => {
        return {
          vendorId: device.vendor_id,
        };
      });

      navigator.usb
        .requestDevice({ filters: deviceFilters })
        .then((device: any) => {
          device
            .open()
            .then(() => {
              setScannerStatus("connected");
              consola.success("Connected to scanner");
              resolve(device);
            })
            .catch((_error: DOMException) => {
              consola.error("Error connecting to scanner");
              setScannerStatus("error");
              reject("Error connecting to scanner");
            });
        })
        .catch((error: DOMException) => {
          if (error.message.includes("No device selected.")) {
            resolve(null);
          } else {
            consola.error("Error connecting to scanner");
            setScannerStatus("error");
            reject("Error connecting to scanner");
          }
        });
    });
  });
};
