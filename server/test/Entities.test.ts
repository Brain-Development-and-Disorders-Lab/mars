// .env configuration
import "dotenv/config";

// Jest imports
import { afterAll, afterEach, beforeEach, describe, expect, it } from "@jest/globals";

// Entity operations and types
import { EntityModel } from "../../types";
import { Entities } from "../src/operations/Entities";

// Database connectivity
import { connect, disconnect, getDatabase } from "../src/database/connection";

// Connect to the database before each test
beforeEach(() => {
  return connect();
});

// Clear the database after each test
afterEach(() => {
  return Promise.all([
    getDatabase().collection("attributes").deleteMany({}),
    getDatabase().collection("collections").deleteMany({}),
    getDatabase().collection("entities").deleteMany({}),
    getDatabase().collection("updates").deleteMany({}),
  ]);
});

// Close the database connection after all tests
afterAll(() => {
  return disconnect();
});

describe("GET /entities", () => {
  it("should return 0 Entities with an empty database", async () => {
    return Entities.getAll().then((result) => {
      expect(result.length).toBe(0);
    });
  });
});

describe("POST /entities", () => {
  it("should create 1 Entity", async () => {
    return Entities.create({
      name: "TestEntity",
      created: new Date(Date.now()),
      owner: "henry.burgess@wustl.edu",
      description: "Test",
      collections: [],
      associations: {
        origins: [],
        products: [],
      },
      attributes: [],
    }).then((result: EntityModel) => {
      expect(result.name).toBe("TestEntity");
    });
  });
});
