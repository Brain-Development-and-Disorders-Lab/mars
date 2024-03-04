// Libraries
import express from "express";
import _ from "lodash";

import { System } from "../operations/System";
import dayjs from "dayjs";
import { DeviceModel, EntityModel } from "@types";
import { GridFSBucketReadStream } from "mongodb";
import { authenticate } from "../util";

const SystemRoute = express.Router();

// Route: Start backup operation
SystemRoute.route("/system/backup").get(
  authenticate,
  (_request: any, response: any) => {
    System.backup().then((path: string) => {
      response.setHeader("Content-Type", "application/json");
      response.download(path, `backup_${dayjs(Date.now()).toJSON()}.json`);
    });
  }
);

// Route: Import JSON file
SystemRoute.route("/system/importJSON").post(
  authenticate,
  (request: any, response: any) => {
    System.importJSON(request.body.jsonData)
      .then((result: { status: boolean; message: string; data?: any }) => {
        response.json({
          status: result.status ? "success" : "error",
          message: result.message,
          data: _.isUndefined(result.data) ? "" : result.data,
        });
      })
      .catch((reason: { message: string }) => {
        response.json({ status: "error", message: reason.message });
      });
  }
);

// Route: Import CSV file
SystemRoute.route("/system/import").post(
  authenticate,
  (request: any, response: any) => {
    System.import(request.files, request.body.type)
      .then((result: { status: boolean; message: string; data?: any }) => {
        response.json({
          status: result.status ? "success" : "error",
          message: result.message,
          data: _.isUndefined(result.data) ? "" : result.data,
        });
      })
      .catch((reason: { message: string }) => {
        response.json({ status: "error", message: reason.message });
      });
  }
);

// Route: Import mappings
SystemRoute.route("/system/import/mapping").post(
  authenticate,
  (request: any, response: any) => {
    System.mapData(request.body.fields, request.body.data)
      .then((entities: EntityModel[]) => {
        response.json({
          status: "success",
          message: `Imported ${entities.length} Entities`,
        });
      })
      .catch((reason: { message: string }) => {
        response.json({ status: "error", message: reason.message });
      });
  }
);

// Route: Upload image
SystemRoute.route("/system/upload").post(
  authenticate,
  (request: any, response: any) => {
    System.upload(request.files, request.body.target)
      .then((result: { status: boolean; message: string; data?: any }) => {
        response.json({
          status: result.status ? "success" : "error",
          message: result.message,
          data: _.isUndefined(result.data) ? "" : result.data,
        });
      })
      .catch((reason: { message: string }) => {
        response.json({ status: "error", message: reason.message });
      });
  }
);

// Route: Download file
SystemRoute.route("/system/download/:id").get(
  authenticate,
  (request: any, response: any) => {
    System.download(request.params.id)
      .then((result: { status: boolean; stream: GridFSBucketReadStream }) => {
        result.stream.on("data", (chunk) => {
          response.write(chunk);
        });

        result.stream.on("error", () => {
          response.sendStatus(404);
        });

        result.stream.on("end", () => {
          response.end();
        });
      })
      .catch((reason: { message: string }) => {
        response.json({ status: "error", message: reason.message });
      });
  }
);

// Route: Get file information
SystemRoute.route("/system/file/:id").get(
  authenticate,
  (request: any, response: any) => {
    System.getFileInformation(request.params.id)
      .then((result: { status: boolean; data: any[] }) => {
        response.json(result);
      })
      .catch((reason: { message: string }) => {
        response.json({ status: "error", message: reason.message });
      });
  }
);

// Route: Get all Devices
SystemRoute.route("/system/devices").get(
  authenticate,
  (_request: any, response: any) => {
    System.getDevices().then((devices: DeviceModel[]) => {
      response.json(devices);
    });
  }
);

// Route: Get specific Device
SystemRoute.route("/system/devices/:id").get(
  authenticate,
  (request: any, response: any) => {
    System.getDevice(request.params.id).then((device: DeviceModel) => {
      response.json(device);
    });
  }
);

export default SystemRoute;
