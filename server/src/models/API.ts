// Express
import { NextFunction, Request, Response, Router } from "express";

// Utility functions and libraries
import _ from "lodash";
import dayjs from "dayjs";
import crypto from "crypto";

// Custom types
import { APIData, APIKey, EntityModel, ResponseData } from "@types";

// Models
import { Entities } from "@models/Entities";
import { User } from "@models/User";
import { Workspaces } from "@models/Workspaces";
import { Activity } from "@models/Activity";

// Setup the Express router
const APIRouter = Router();

// Manage active API versions
const API_VERSION = "v1";

export class API {
  static generateKey = async (scope: "edit" | "view", workspaces: string[]): Promise<ResponseData<APIKey>> => {
    const output = crypto.randomBytes(32).toString("hex");

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

  static validateRequest = async (request: Request, response: Response): Promise<APIKey | null> => {
    // Check if API key provided
    if (_.isUndefined(request.headers["api_key"])) {
      const responseData: APIData<object> = {
        path: request.params.path,
        version: API_VERSION,
        status: "unauthorized",
        message: "No API key provided",
        data: {},
      };

      response.contentType("application/json").status(401).send(JSON.stringify(responseData)).end();
      return null;
    }

    // Extract the key from the request headers
    const providedKey = request.headers["api_key"].toString();

    // Validate that the API key exists and that the User has API permissions
    const apiUser = await User.findByKey(providedKey);
    if (_.isNull(apiUser)) {
      const responseData: APIData<object> = {
        path: request.params.path,
        version: API_VERSION,
        status: "unauthorized",
        message: "Invalid API key",
        data: {},
      };
      response.contentType("application/json").status(401).send(JSON.stringify(responseData)).end();
      return null;
    } else if (_.isUndefined(apiUser.features.api) || apiUser.features.api === false) {
      const responseData: APIData<object> = {
        path: request.params.path,
        version: API_VERSION,
        status: "unauthorized",
        message: "API access not permitted",
        data: {},
      };
      response.contentType("application/json").status(401).send(JSON.stringify(responseData)).end();
      return null;
    }

    // `api_keys` is stored as a JSON string by better-auth, parse before filtering
    const parsedKeys: APIKey[] = JSON.parse(apiUser.api_keys as unknown as string);
    const apiKey = parsedKeys.filter((key) => _.isEqual(key.value, providedKey)).pop();
    if (_.isUndefined(apiKey)) {
      const responseData: APIData<object> = {
        path: request.params.path,
        version: API_VERSION,
        status: "unauthorized",
        message: "API key not associated with User",
        data: {},
      };
      response.contentType("application/json").status(401).send(JSON.stringify(responseData)).end();
      return null;
    }

    // Attach to res.locals so downstream handlers don't need to re-validate
    response.locals.apiKey = apiKey;
    response.locals.apiUser = apiUser;

    return apiKey;
  };

  static authenticate = async (request: Request, response: Response, next: NextFunction) => {
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
      response.contentType("application/json").status(401).send(JSON.stringify(responseData)).end();
      return;
    }

    // Enforce scope: POST routes require an "edit" key
    if (request.method === "POST" && apiKey.scope !== "edit") {
      const responseData: APIData<object> = {
        path: request.params.path,
        version: API_VERSION,
        status: "unauthorized",
        message: "API key does not have edit permissions",
        data: {},
      };
      response.contentType("application/json").status(403).send(JSON.stringify(responseData)).end();
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
  static status = async (_request: Request, response: Response): Promise<void> => {
    const responseData: APIData<object> = {
      path: "/",
      version: API_VERSION,
      status: "success",
      message: "API status OK",
      data: {},
    };

    response.contentType("application/json").status(200).send(JSON.stringify(responseData)).end();
    return;
  };

  /**
   * Handler function to process all other non-status API queries
   * @param request
   * @param response
   * @return {Promise<void>}
   */
  static handler = async (request: Request, response: Response): Promise<void> => {
    // apiKey and apiUser are already resolved and validated by the authenticate middleware
    const apiKey: APIKey = response.locals.apiKey;
    const userId: string = response.locals.apiUser._id.toString();

    if (request.method === "GET") {
      switch (request.params.path) {
        case "entities": {
          const responseData = await API.getEntities(userId, apiKey, request);
          let status = 200;
          if (responseData.status === "error") status = 400;
          if (responseData.status === "unauthorized") status = 401;
          response.contentType("application/json").status(status).send(JSON.stringify(responseData)).end();
          return;
        }
        case "entity": {
          const responseData = await API.getEntity(userId, apiKey, request);
          let status = 200;
          if (responseData.status === "error") status = 400;
          if (responseData.status === "unauthorized") status = 401;
          response.contentType("application/json").status(status).send(JSON.stringify(responseData)).end();
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

          response.contentType("application/json").status(400).send(JSON.stringify(responseData)).end();
          return;
        }
      }
    } else if (request.method === "POST") {
      switch (request.params.path) {
        case "entity": {
          const responseData = await API.updateEntity(userId, apiKey, request);
          let status = 200;
          if (responseData.status === "error") status = 400;
          if (responseData.status === "unauthorized") status = 401;
          response.contentType("application/json").status(status).send(JSON.stringify(responseData)).end();
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

          response.contentType("application/json").status(400).send(JSON.stringify(responseData)).end();
          return;
        }
      }
    }
  };

  static getEntities = async (userId: string, apiKey: APIKey, request: Request): Promise<APIData<EntityModel[]>> => {
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

    const workspaceId = workspaceIdentifier.toString();

    // Enforce workspace scoping: if the key is restricted to specific workspaces,
    // the requested workspace must be in that list
    if (apiKey.workspaces.length > 0 && !_.includes(apiKey.workspaces, workspaceId)) {
      return {
        path: `/${request.params.path}`,
        version: API_VERSION,
        status: "unauthorized",
        message: "API key is not authorized for this Workspace",
        data: [],
      };
    }

    // Retrieve the Workspace to determine which Entities to return
    const workspace = await Workspaces.getOne(workspaceId);
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
    if (!_.isEqual(workspace.owner, userId) && !_.includes(workspace.collaborators, userId)) {
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

  static getEntity = async (userId: string, apiKey: APIKey, request: Request): Promise<APIData<EntityModel>> => {
    // Extract query parameters
    const entityIdentifier = request.query.id;
    if (_.isUndefined(entityIdentifier)) {
      return {
        path: `/${request.params.path}`,
        version: API_VERSION,
        status: "error",
        message: "Query parameter 'id' not provided",
        data: {} as EntityModel,
      };
    }

    // Get all Entities that User has access to, limited to key-scoped workspaces if applicable
    const allWorkspaces = await Workspaces.all();
    const userWorkspaces = allWorkspaces.filter(
      (w) =>
        (_.isEqual(w.owner, userId) || _.includes(w.collaborators, userId)) &&
        (apiKey.workspaces.length === 0 || _.includes(apiKey.workspaces, w._id)),
    );

    const entitiesAccessible = userWorkspaces.flatMap((w) => w.entities);

    // Check if Entity is included in total set of Entities accessible to User
    if (_.includes(entitiesAccessible, entityIdentifier.toString())) {
      const entity = await Entities.getOne(entityIdentifier.toString());
      if (_.isNull(entity)) {
        return {
          path: `/${request.params.path}`,
          version: API_VERSION,
          status: "error",
          message: "Unable to get Entity",
          data: {} as EntityModel,
        };
      }
      return {
        path: `/${request.params.path}`,
        version: API_VERSION,
        status: "success",
        message: "Retrieved Entity",
        data: entity,
      };
    } else {
      return {
        path: `/${request.params.path}`,
        version: API_VERSION,
        status: "unauthorized",
        message: "Unknown Entity or unauthorized to access Entity",
        data: {} as EntityModel,
      };
    }
  };

  static updateEntity = async (userId: string, apiKey: APIKey, request: Request): Promise<APIData<object>> => {
    // Extract query parameters
    const entityIdentifier = request.body._id;
    if (_.isUndefined(entityIdentifier)) {
      return {
        path: `/${request.params.path}`,
        version: API_VERSION,
        status: "error",
        message: "Invalid Entity data",
        data: {},
      };
    }

    // Get all Workspaces accessible to this user, limited to key-scoped workspaces if applicable
    const allWorkspaces = await Workspaces.all();
    const userWorkspaces = allWorkspaces.filter(
      (w) =>
        (_.isEqual(w.owner, userId) || _.includes(w.collaborators, userId)) &&
        (apiKey.workspaces.length === 0 || _.includes(apiKey.workspaces, w._id)),
    );

    const entitiesAccessible = userWorkspaces.flatMap((w) => w.entities);

    // Check if Entity is included in total set of Entities accessible to User
    if (_.includes(entitiesAccessible, entityIdentifier)) {
      const entity = await Entities.getOne(entityIdentifier);
      if (_.isNull(entity)) {
        return {
          path: `/${request.params.path}`,
          version: API_VERSION,
          status: "error",
          message: "Entity does not exist",
          data: {},
        };
      }

      // Apply update operation
      const result = await Entities.update(request.body);
      if (result.success === false) {
        return {
          path: `/${request.params.path}`,
          version: API_VERSION,
          status: "error",
          message: "Unable to update Entity",
          data: {},
        };
      }

      // Add history to Entity
      await Entities.addHistory(entity, userId, "Updated via API");

      // Find the Workspace the Entity belongs to and create an Activity entry
      const activeWorkspace = userWorkspaces.find((w) => _.includes(w.entities, entityIdentifier));
      if (activeWorkspace) {
        const activity = await Activity.create({
          timestamp: dayjs(Date.now()).toISOString(),
          type: "update",
          actor: userId,
          details: "Updated Entity",
          target: {
            _id: entity._id,
            type: "entities",
            name: entity.name,
          },
          medium: "API",
        });

        // Add Activity to Workspace
        await Workspaces.addActivity(activeWorkspace._id, activity.data);
      }

      return {
        path: `/${request.params.path}`,
        version: API_VERSION,
        status: "success",
        message: "Updated Entity successfully",
        data: {},
      };
    } else {
      return {
        path: `/${request.params.path}`,
        version: API_VERSION,
        status: "unauthorized",
        message: "Unknown Entity or unauthorized to access Entity",
        data: {},
      };
    }
  };
}

export default () => {
  APIRouter.get("/", API.authenticate, API.status);
  APIRouter.get("/:path", API.authenticate, API.handler);
  APIRouter.post("/:path", API.authenticate, API.handler);
  return APIRouter;
};
