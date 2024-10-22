// Express
import { NextFunction, Request, Response, Router } from "express";

// Utility functions and libraries
import _ from "lodash";
import dayjs from "dayjs";
import crypto from "crypto";
import { hash } from "bcryptjs";

// Custom types
import { APIData, APIKey, EntityModel, ResponseData } from "@types";

// Models
import { Entities } from "./Entities";
import { Users } from "./Users";
import { Workspaces } from "./Workspaces";

// Setup the Express router
const APIRouter = Router();

// Manage active API versions
const API_VERSION = "v1";

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

  static validateRequest = async (
    request: Request,
    response: Response,
  ): Promise<APIKey | null> => {
    // Check if API key provided
    if (_.isUndefined(request.headers["api_key"])) {
      const responseData: APIData<object> = {
        path: request.params.path,
        version: API_VERSION,
        status: "unauthorized",
        message: "No API key provided",
        data: {},
      };

      response
        .contentType("application/json")
        .status(401)
        .send(JSON.stringify(responseData))
        .end();
      return null;
    }

    // Extract the key from the request headers
    const providedKey = request.headers["api_key"].toString();

    // Validate that the API key exists
    const apiUser = await Users.findByKey(providedKey);
    if (_.isNull(apiUser)) {
      const responseData: APIData<object> = {
        path: request.params.path,
        version: API_VERSION,
        status: "unauthorized",
        message: "Invalid API key",
        data: {},
      };
      response
        .contentType("application/json")
        .status(401)
        .send(JSON.stringify(responseData))
        .end();
      return null;
    }

    // Validate that the API key is current
    // Get the `APIKey` instance
    const apiKey = apiUser.api_keys
      .filter((key) => _.isEqual(key.value, providedKey))
      .pop();
    if (_.isUndefined(apiKey)) {
      const responseData: APIData<object> = {
        path: request.params.path,
        version: API_VERSION,
        status: "unauthorized",
        message: "API key not associated with User",
        data: {},
      };
      response
        .contentType("application/json")
        .status(401)
        .send(JSON.stringify(responseData))
        .end();
      return null;
    }

    return apiKey;
  };

  static authenticate = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    const apiKey = await API.validateRequest(request, response);
    if (_.isNull(apiKey)) {
      return;
    }

    // Compare the expiration date and the current system time
    if (dayjs(apiKey.expires).diff() < 0) {
      const responseData: APIData<object> = {
        path: request.params.path,
        version: API_VERSION,
        status: "unauthorized",
        message: "API key expired",
        data: {},
      };
      response
        .contentType("application/json")
        .status(401)
        .send(JSON.stringify(responseData))
        .end();
      return;
    }

    // If all authentication checks pass, continue to the next middleware
    next();
  };

  /**
   * Generic `status` response, returned if querying the root path of the API
   * @param request
   * @param response
   * @return {Promise<void>}
   */
  static status = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const responseData: APIData<object> = {
      path: "/",
      version: API_VERSION,
      status: "success",
      message: "API status OK",
      data: {},
    };

    response
      .contentType("application/json")
      .status(200)
      .send(JSON.stringify(responseData))
      .end();
    return;
  };

  /**
   * Handler function to process all other non-status API queries
   * @param request
   * @param response
   * @return {Promise<void>}
   */
  static handler = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    // Validate the API request
    const apiKey = await API.validateRequest(request, response);
    if (_.isNull(apiKey)) {
      return;
    }

    // Get the `UserModel` associated with the API key
    const user = await Users.findByKey(apiKey.value);
    if (_.isNull(user)) {
      return;
    }

    switch (request.params.path) {
      case "entities": {
        const responseData = await API.getEntities(user._id, request);
        let status = 200;
        if (responseData.status === "error") status = 400;
        if (responseData.status === "unauthorized") status = 401;
        response
          .contentType("application/json")
          .status(status)
          .send(JSON.stringify(responseData))
          .end();
        return;
      }
      default: {
        const responseData: APIData<object> = {
          path: `/${request.params.path}`,
          version: API_VERSION,
          status: "error",
          message: `Invalid path: /${request.params.path}`,
          data: {},
        };

        response
          .contentType("application/json")
          .status(400)
          .send(JSON.stringify(responseData))
          .end();
        return;
      }
    }
  };

  static getEntities = async (
    orcid: string,
    request: Request,
  ): Promise<APIData<EntityModel[]>> => {
    // Extract the query parameters
    const workspaceIdentifier = request.query.workspace;
    if (_.isUndefined(workspaceIdentifier)) {
      return {
        path: `/${request.params.path}`,
        version: API_VERSION,
        status: "error",
        message: "Query parameter 'workspace' not provided",
        data: [],
      };
    }

    // Retrieve the Workspace to determine which Entities to return
    const workspace = await Workspaces.getOne(workspaceIdentifier.toString());
    if (_.isNull(workspace)) {
      return {
        path: `/${request.params.path}`,
        version: API_VERSION,
        status: "error",
        message: "Invalid 'workspace' identifier",
        data: [],
      };
    }

    // Ensure User is the owner or a collaborator
    if (
      !_.isEqual(workspace.owner, orcid) &&
      !_.includes(workspace.collaborators, orcid)
    ) {
      return {
        path: `/${request.params.path}`,
        version: API_VERSION,
        status: "unauthorized",
        message: "Not authorized to access Workspace",
        data: [],
      };
    }

    // Filter by ownership and Workspace membership
    const entities = await Entities.getMany(workspace.entities);

    return {
      path: `/${request.params.path}`,
      version: API_VERSION,
      status: "success",
      message: "Retrieved all Entities associated with Workspace",
      data: entities,
    };
  };
}

export default () => {
  APIRouter.get("/", API.authenticate, API.status);
  APIRouter.get("/:path", API.authenticate, API.handler);
  return APIRouter;
};
