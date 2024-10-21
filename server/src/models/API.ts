// Express
import { NextFunction, Request, Response, Router } from "express";

// Utility functions and libraries
import _ from "lodash";
import dayjs from "dayjs";
import { hash } from "bcryptjs";

// Custom types
import { APIKey, ResponseData } from "@types";

// Models
import { Users } from "./Users";

// Setup the Express router
const APIRouter = Router();

export class API {
  static generateKey = async (
    scope: "edit" | "view",
    workspaces: string[],
  ): Promise<ResponseData<APIKey>> => {
    const token = crypto.randomUUID();
    const output = (await hash(token, 10)).slice(7);

    return {
      success: true,
      message: "Generated new API key",
      data: {
        value: output,
        expires: dayjs(Date.now()).add(1, "month").toISOString(),
        scope: scope,
        workspaces: workspaces,
      },
    };
  };

  static authenticate = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    // Check if API key provided
    if (_.isUndefined(request.headers["api_key"])) {
      response.status(401).send("No API key provided").end();
      return;
    }

    // Extract the key from the request headers
    const providedKey = request.headers["api_key"].toString();

    // Validate that the API key exists
    const apiUser = await Users.findByKey(providedKey);
    if (_.isNull(apiUser)) {
      response.status(401).send("Invalid API key").end();
      return;
    }

    // Validate that the API key is current
    // Get the `APIKey` instance
    const apiKey = apiUser.api_keys
      .filter((key) => _.isEqual(key.value, providedKey))
      .pop();
    if (_.isUndefined(apiKey)) {
      response.status(500).send("API key not associated with User").end();
      return;
    }

    // Compare the expiration date and the current system time
    if (dayjs(apiKey.expires).diff() < 0) {
      response.status(401).send("API key expired").end();
      return;
    }

    // Validate that the API key scope is respected

    // Validate that the API key ORCiD has access to the requested resource or operation

    // If all authentication checks pass, continue to the next middleware
    next();
  };

  static handler = (request: Request, response: Response) => {
    switch (request.path) {
      case "/":
        response.status(200).send("API status: OK").end();
        return;
    }
  };
}

export default () => {
  APIRouter.get("/", API.authenticate, API.handler);
  return APIRouter;
};
