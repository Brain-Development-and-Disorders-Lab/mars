// Libraries
import express from "express";
import _ from "lodash";

import { UserModel } from "@types";

import { Users } from "../operations/Users";

import { authenticate } from "src/util";

const UsersRoute = express.Router();

// Route: Get a user
UsersRoute.route("/users/:id").get(authenticate, (request: any, response: any) => {
  Users.get(request.params.id).then((userInfo: { status: string, user?: UserModel}) => {
    response.json(userInfo);
  }).catch((error) => {
    response.json({ status: "error", message: error.message });
  });
});

export default UsersRoute;
