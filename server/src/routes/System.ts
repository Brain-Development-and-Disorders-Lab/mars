// Libraries
import express from "express";
import _ from "lodash";

import { System } from "../operations/System";
import { DeviceModel } from "@types";
import { authenticate } from "../util";

const SystemRoute = express.Router();

// Route: Get all Devices
SystemRoute.route("/system/devices").get(
  authenticate,
  (_request: any, response: any) => {
    System.getDevices().then((devices: DeviceModel[]) => {
      response.json(devices);
    });
  },
);

// Route: Get specific Device
SystemRoute.route("/system/devices/:id").get(
  authenticate,
  (request: any, response: any) => {
    System.getDevice(request.params.id).then((device: DeviceModel) => {
      response.json(device);
    });
  },
);

export default SystemRoute;
