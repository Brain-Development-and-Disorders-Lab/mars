// Custom types
import { ScannerStatus } from "@types";

// Utility functions and libraries
import { consola } from "consola";
import _ from "lodash";

// Vendor ID is unique to scanner
const VENDOR_ID = 0x11FA;

export const connectScanner = (setScannerStatus: React.Dispatch<React.SetStateAction<ScannerStatus>>): Promise<any> => {
  return new Promise((resolve, reject) => {
    navigator.usb.requestDevice({ filters: [{ vendorId: VENDOR_ID }] })
      .then((device: any) => {
        consola.success("Connected to scanner");
        setScannerStatus("connected");
        resolve(device);
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
};
