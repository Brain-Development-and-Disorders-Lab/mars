// Custom types
import { request } from "@database/functions";
import { DeviceModel, ScannerStatus } from "@types";

// Utility functions and libraries
import { consola } from "consola";
import _ from "lodash";

export const connectScanner = async (
  setScannerStatus: React.Dispatch<React.SetStateAction<ScannerStatus>>,
): Promise<any> => {
  const response = await request<DeviceModel[]>("GET", "/system/devices");
  const deviceFilters = response.data.map((device: DeviceModel) => {
    return {
      vendorId: device.vendor_id,
    };
  });
  let device = null;
  try {
    const device = await navigator.usb.requestDevice({
      filters: deviceFilters,
    });
    await device.open();
    setScannerStatus("connected");
    consola.success("Connected to scanner");
  } catch (error: any) {
    setScannerStatus("error");
    consola.error("Error connecting to scanner");
  }
  return device;
};
