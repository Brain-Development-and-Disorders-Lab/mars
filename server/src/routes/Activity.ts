// Libraries
import express from "express";
import _ from "lodash";

// Utility functions
import { ActivityModel, IActivity } from "@types";

import { Activity } from "../operations/Activity";

const ActivityRoute = express.Router();

// Route: View all Activity
ActivityRoute.route("/activity").get((_request: any, response: any) => {
  Activity.getAll().then((activity: ActivityModel[]) => {
    response.json(activity);
  });
});

// Route: Create new Activity
ActivityRoute.route("/activity/create").post(
  (request: { body: IActivity }, response: any) => {
    Activity.create(request.body).then((activity: IActivity) => {
      response.json({
        id: activity.target.id,
        name: activity.target.name,
        status: "success",
      });
    });
  }
);

export default ActivityRoute;
