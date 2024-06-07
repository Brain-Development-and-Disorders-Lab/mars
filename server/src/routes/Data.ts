// Libraries
import express from "express";
import _ from "lodash";

import { Data } from "../operations/Data";
import dayjs from "dayjs";
import { EntityModel } from "@types";
import { GridFSBucketReadStream } from "mongodb";
import { authenticate } from "../util";

const DataRoute = express.Router();

// Route: Start backup operation
DataRoute.route("/data/backup").get(
  authenticate,
  (_request: any, response: any) => {
    Data.backup().then((path: string) => {
      response.setHeader("Content-Type", "application/json");
      response.download(path, `backup_${dayjs(Date.now()).toJSON()}.json`);
    });
  },
);

// Route: Import JSON file
DataRoute.route("/data/importJSON").post(
  authenticate,
  (request: any, response: any) => {
    Data.importJSON(request.body.jsonData)
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
  },
);

// Route: Import CSV file
DataRoute.route("/data/import").post(
  authenticate,
  (request: any, response: any) => {
    Data.import(request.files, request.body.type)
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
  },
);

// Route: Import mappings
DataRoute.route("/data/import/mapping").post(
  authenticate,
  (request: any, response: any) => {
    Data.mapData(request.body.fields, request.body.data)
      .then((entities: EntityModel[]) => {
        response.json({
          status: "success",
          message: `Imported ${entities.length} Entities`,
        });
      })
      .catch((reason: { message: string }) => {
        response.json({ status: "error", message: reason.message });
      });
  },
);

// Route: Upload image
DataRoute.route("/data/upload").post(
  authenticate,
  (request: any, response: any) => {
    Data.upload(request.files, request.body.target)
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
  },
);

// Route: Download file
DataRoute.route("/data/download/:id").get(
  authenticate,
  (request: any, response: any) => {
    Data.download(request.params.id)
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
  },
);

// Route: Get file information
DataRoute.route("/data/file/:id").get(
  authenticate,
  (request: any, response: any) => {
    Data.getFileInformation(request.params.id)
      .then((result: { status: boolean; data: any[] }) => {
        response.json(result);
      })
      .catch((reason: { message: string }) => {
        response.json({ status: "error", message: reason.message });
      });
  },
);

export default DataRoute;
