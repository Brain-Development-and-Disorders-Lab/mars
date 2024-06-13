// Libraries
import express from "express";

// Existing and custom types
import { AuthInfo } from "@types";

// Operations
import { Authentication } from "../operations/Authentication";

const AuthenticationRoute = express.Router();

// Route: Login
AuthenticationRoute.route("/login").post(
  (request: { body: { code: string } }, response: any) => {
    Authentication.login(request.body.code)
      .then((token: AuthInfo) => {
        response.json(token);
      })
      .catch((_error) => {
        response.json({});
      });
  },
);

export default AuthenticationRoute;
