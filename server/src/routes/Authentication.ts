// Libraries
import express from "express";

// Operations
import { Authentication } from "../operations/Authentication";

const AuthenticationRoute = express.Router();

// Route: View all attributes
AuthenticationRoute.route("/login").post((request: { body: { password: string } }, response: any) => {
  Authentication.login(request.body.password).then((token: string) => {
    response.json({
      status: "success",
      token: token,
    });
  });
});

export default AuthenticationRoute;
