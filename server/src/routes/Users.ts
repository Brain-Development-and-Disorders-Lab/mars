// Libraries
import express from "express";
import _ from "lodash";

import { Users } from "../operations/Users";

import { UserModel } from "@types";

const UsersRoute = express.Router();

// Route: Get a user
UsersRoute.route("/users/:id").get((request: any, response: any) => {
  Users.get(request.params.id).then((userInfo: { status: string, user?: UserModel}) => {
    response.json(userInfo);
  }).catch((error) => {
    response.json({ status: "error", message: error.message });
  });
});

export default UsersRoute;
