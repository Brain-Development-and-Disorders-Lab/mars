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
    console.log("Logging in: ", request.body.code);
    Authentication.login(request.body.code)
      .then((token: AuthInfo) => {
        response.json({
          status: "success",
          token: token,
        });
      })
      .catch((error) => {
        response.json({
          status: "error",
          token: {},
          message: error,
        });
      });
  }
);

// Route: Validate "id_token"
AuthenticationRoute.route("/validate").post((request: any, response: any) => {
  Authentication.validate(request.headers["id_token"])
    .then((isValid: boolean) => {
      response.json({
        valid: isValid,
      });
    })
    .catch((error) => {
      response.json({
        status: "error",
        message: error,
      });
    });
});

export default AuthenticationRoute;
