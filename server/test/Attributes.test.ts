// .env configuration
import "dotenv/config";

// Jest imports
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "@jest/globals";

// Attribute operations and types
import { AttributeModel } from "../../types";
import { Attributes } from "../src/operations/Attributes";

// Database connectivity
import {
  connectPrimary,
  disconnect,
  getDatabase,
} from "../src/database/connection";

// Connect to the database before each test
beforeEach(() => {
  return connectPrimary();
});

// Clear the database after each test
afterEach(() => {
  return Promise.all([
    getDatabase().collection("attributes").deleteMany({}),
    getDatabase().collection("collections").deleteMany({}),
    getDatabase().collection("entities").deleteMany({}),
    getDatabase().collection("activity").deleteMany({}),
  ]);
});

// Close the database connection after all tests
afterAll(() => {
  return disconnect();
});

describe("GET /attributes", () => {
  it("should return 0 Attributes with an empty database", async () => {
    return Attributes.getAll().then((result) => {
      expect(result.length).toBe(0);
    });
  });
});

describe("POST /attributes/create", () => {
  it("should create 1 basic Attribute", async () => {
    return Attributes.create({
      name: "TestAttribute",
      description: "Attribute description",
      values: [],
    }).then((result: AttributeModel) => {
      expect(result.name).toBe("TestAttribute");
    });
  });
});

describe("POST /attributes/update", () => {
  it("should update the description", async () => {
    return Attributes.create({
      name: "TestAttribute",
      description: "Attribute description",
      values: [],
    })
      .then((result: AttributeModel) => {
        return Attributes.update({
          _id: result._id,
          name: result.name,
          description: "Updated Attribute description",
          values: result.values,
        });
      })
      .then((result: AttributeModel) => {
        expect(result.description).toBe("Updated Attribute description");
      });
  });

  it("should update the values", async () => {
    return Attributes.create({
      name: "TestAttribute",
      description: "Attribute description",
      values: [],
    })
      .then((result: AttributeModel) => {
        return Attributes.update({
          _id: result._id,
          name: result.name,
          description: result.description,
          values: [
            {
              identifier: "v_0",
              name: "Value0",
              type: "text",
              data: "Test",
            },
          ],
        });
      })
      .then((result: AttributeModel) => {
        expect(result.values.length).toBe(1);
        expect(result.values[0].name).toBe("Value0");
        expect(result.values[0].type).toBe("text");
        expect(result.values[0].data).toBe("Test");
      });
  });
});
