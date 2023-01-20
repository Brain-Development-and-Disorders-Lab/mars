// Libraries
import express from "express";
import consola from "consola";
import _ from "underscore";

// Utility functions
import { getDatabase } from "../database/connection";
import { registerUpdate } from "../database/operations/Updates";
import { UpdateStruct } from "@types";

// Constants
const UPDATES_COLLECTION = "updates";

const UpdatesRoute = express.Router();

// Route: View all Updates
UpdatesRoute.route("/updates").get((request: any, response: any) => {
  consola.debug("View all Updates:", "/updates");

  getDatabase()
    .collection(UPDATES_COLLECTION)
    .find({})
    .toArray((error: any, result: any) => {
      if (error) throw error;
      response.json(result);
    });
});

// Route: Create a new Update
UpdatesRoute.route("/updates/create").post((request: { body: UpdateStruct }, response: any) => {
  consola.debug("Create new Update:", "/updates/create", '"' + request.body + '"');

  registerUpdate(request.body);
});

export default UpdatesRoute;
