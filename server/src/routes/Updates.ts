// Libraries
import express from "express";
import _ from "lodash";

// Utility functions
import { UpdateModel, Update } from "@types";

import { Updates } from "../operations/Updates";

const UpdatesRoute = express.Router();

// Route: View all Updates
UpdatesRoute.route("/updates").get((_request: any, response: any) => {
  Updates.getAll().then((updates: UpdateModel[]) => {
    response.json(updates);
  });
});

// Route: Create a new Update
UpdatesRoute.route("/updates/create").post(
  (request: { body: Update }, response: any) => {
    Updates.create(request.body).then((update: Update) => {
      response.json({
        id: update.target.id,
        name: update.target.name,
        status: "success",
      });
    });
  }
);

export default UpdatesRoute;
