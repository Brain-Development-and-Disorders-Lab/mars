// Libraries
import express from "express";

// Existing and custom types
import { AuthInfo } from "@types";

// Operations
import { Authentication } from "../operations/Authentication";

const AuthenticationRoute = express.Router();

// Route: View all attributes
AuthenticationRoute.route("/login").post(
  (request: { body: { code: string } }, response: any) => {
    Authentication.login(request.body.code)
      .then((token: AuthInfo) => {
        response.json({
          status: "success",
          token: token,
        });
      })
      .catch(() => {
        response.json({
          status: "error",
          token: {},
        });
      });
  }
);

export default AuthenticationRoute;
