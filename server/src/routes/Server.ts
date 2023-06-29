// Libraries
import express from "express";
import _ from "lodash";

import { Server } from "../operations/Server";
import dayjs from "dayjs";

const ServerRoute = express.Router();

// Route: Start backup operation
ServerRoute.route("/server/backup").get((_request: any, response: any) => {
  Server.backup().then((path: string) => {
    response.setHeader("Content-Type", "application/json");
    response.download(path, `server_backup_${dayjs(Date.now()).toJSON()}.json`);
  });
});

// Route: Import JSON file
ServerRoute.route("/server/import").post((request: any, response: any) => {
  Server.import(request.files)
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

export default ServerRoute;
