import { checkEntitiesOwnership } from "../src/routes/Entities";
import { Request, Response, NextFunction } from "express";
import * as EntitiesModule from "../src/operations/Entities";
import * as AuthModule from "../src/operations/Authentication";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

interface CustomRequest extends Request {
  user?: {
    _id: string;
  };
  entity?: {
    _id: string;
  };
}

// Mock the entire EntitiesModule
jest.mock("../src/operations/Entities", () => ({
  Entities: {
    getOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));
jest.mock("../src/operations/Authentication", () => ({
  Authentication: {
    validate: jest.fn(),
  },
}));

describe("checkEntitiesOwnership", () => {
  let req: Partial<CustomRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      params: {
        id: "entity-id",
      },
      user: {
        _id: "user-id",
      },
      headers: {
        id_token: "Bearer <token>",
      },
    } as any;
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    next = jest.fn() as any;

    // Mocking Entities.getOne and Authentication.validate
    (EntitiesModule.Entities.getOne as jest.Mock).mockResolvedValue({
      _id: "entity-id",
      owner: "user-id",
    } as never);
    (AuthModule.Authentication.validate as jest.Mock).mockResolvedValue({
      _id: "user-id",
    } as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("checkEntitiesOwnership Middleware", () => {
    // Test: Successfully verify ownership
    it("should proceed if user is the owner of the entity", async () => {
      // Setup: Mock user ID and entity ownership
      req.user = { _id: "user-id" };
      req.params = { id: "entity-id" };
      (EntitiesModule.Entities.getOne as jest.Mock).mockResolvedValue({
        _id: "entity-id",
        owner: "user-id",
      } as never);

      await checkEntitiesOwnership(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.entity).toBeDefined();
    });

    // Test: Entity not found
    it("should respond with 404 if the entity is not found", async () => {
      req.params = { id: "non-existent-entity-id" };
      (EntitiesModule.Entities.getOne as jest.Mock).mockResolvedValue(
        null as never,
      );

      await checkEntitiesOwnership(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Entity not found" });
      expect(next).not.toHaveBeenCalled();
    });

    // Test: User not the owner
    it("should respond with 403 if user is not the owner of the entity", async () => {
      req.user = { _id: "user-id" };
      req.params = { id: "entity-id" };
      (EntitiesModule.Entities.getOne as jest.Mock).mockResolvedValue({
        _id: "entity-id",
        owner: "another-user-id",
      } as never);

      await checkEntitiesOwnership(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "User does not have permission to access this entity",
      });
      expect(next).not.toHaveBeenCalled();
    });

    // Test: User not authenticated
    it("should respond with 401 if user is not authenticated", async () => {
      req.user = undefined;
      req.params = { id: "entity-id" };

      await checkEntitiesOwnership(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Authentication required",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
