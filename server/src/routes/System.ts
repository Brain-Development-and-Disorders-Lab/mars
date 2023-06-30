// Libraries
import express from "express";
import _ from "lodash";

import { System } from "../operations/System";
import dayjs from "dayjs";
import { DeviceModel } from "@types";

const SystemRoute = express.Router();

// Route: Start backup operation
SystemRoute.route("/system/backup").get((_request: any, response: any) => {
  System.backup().then((path: string) => {
    response.setHeader("Content-Type", "application/json");
    response.download(path, `backup_${dayjs(Date.now()).toJSON()}.json`);
  });
});

// Route: Import JSON file
SystemRoute.route("/system/import").post((request: any, response: any) => {
  System.import(request.files)
    .then((result: { status: boolean; message: string }) => {
      response.json({
        status: result.status ? "success" : "error",
        message: result.message,
      });
    })
    .catch((reason: { message: string }) => {
      response.json({ status: "error", message: reason.message });
    });
});

// Route: Get all Devices
SystemRoute.route("/system/devices").get((_request: any, response: any) => {
  System.getDevices().then((devices: DeviceModel[]) => {
    response.json(devices);
  });
});

// Route: Get specific Device
SystemRoute.route("/system/devices/:id").get((request: any, response: any) => {
  System.getDevice(request.params.id).then((device: DeviceModel) => {
    response.json(device);
  });
});

export default SystemRoute;
