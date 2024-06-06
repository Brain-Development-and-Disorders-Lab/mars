// Libraries
import express from "express";
import _ from "lodash";

// Utility functions
import { authenticate } from "../util";
import { Activity } from "../operations/Activity";

// Existing and custom types
import { ActivityModel, IActivity } from "@types";

const ActivityRoute = express.Router();

// Route: View all Activity
ActivityRoute.route("/activity").get(
  authenticate,
  (_request: any, response: any) => {
    Activity.getAll().then((activity: ActivityModel[]) => {
      response.json(activity);
    });
  },
);

// Route: Create new Activity
ActivityRoute.route("/activity/create").post(
  authenticate,
  (request: { body: IActivity }, response: any) => {
    Activity.create(request.body).then((activity: IActivity) => {
      response.json({
        id: activity.target.id,
        name: activity.target.name,
        status: "success",
      });
    });
  },
);

export default ActivityRoute;
