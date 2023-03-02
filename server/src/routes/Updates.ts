// Libraries
import express from "express";
import _ from "underscore";

// Utility functions
import { UpdateModel, UpdateStruct } from "@types";

import { Updates } from "../operations/Updates";

const UpdatesRoute = express.Router();

// Route: View all Updates
UpdatesRoute.route("/updates").get((_request: any, response: any) => {
  Updates.getAll().then((updates: UpdateModel[]) => {
    response.json(updates);
  });
});

// Route: Create a new Update
UpdatesRoute.route("/updates/create").post((request: { body: UpdateStruct }, response: any) => {
  Updates.create(request.body).then((update: UpdateStruct) => {
    response.json({
      id: update.target.id,
      name: update.target.name,
      status: "success",
    });
  });
});

export default UpdatesRoute;
