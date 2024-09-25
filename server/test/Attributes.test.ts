// .env configuration
import "dotenv/config";

// Jest imports
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

// Attributes model and types
import { Attributes } from "../src/models/Attributes";
import { AttributeModel, ResponseMessage } from "../../types";

// Database connectivity
import { connect, disconnect } from "../src/connectors/database";
import { clearDatabase } from "./util";

import dayjs from "dayjs";

describe("Attributes model", () => {
  beforeEach(async () => {
    // Connect to the database
    await connect();

    // Clear the database prior to running tests
    await clearDatabase();
  });

  // Teardown after each test
  afterEach(async () => {
    // Clear the database after each test
    await clearDatabase();
    await disconnect();
  });

  it("should return 0 Attributes with an empty database", async () => {
    const result = await Attributes.all();
    expect(result.length).toBe(0);
  });

  it("should create an Attribute", async () => {
    await Attributes.create({
      name: "TestAttribute",
      owner: "henry.burgess@wustl.edu",
      archived: false,
      description: "Attribute description",
      values: [],
    });

    const attributes = await Attributes.all();
    expect(attributes.length).toBe(1);
  });

  it("should get an Attribute", async () => {
    // Create an Attribute and store the identifier
    const result: ResponseMessage = await Attributes.create({
      name: "TestAttribute",
      owner: "henry.burgess@wustl.edu",
      archived: false,
      description: "Attribute description",
      values: [],
    });
    const identifier = result.message;

    // Get the Attribute
    const attribute: AttributeModel | null =
      await Attributes.getOne(identifier);
    expect(attribute).not.toBeNull();
  });

  it("should return multiple requested Attribute entries", async () => {
    // Create a set of Attribute entries
    const NUM_ATTRIBUTES = 4;
    for (let i = 0; i < NUM_ATTRIBUTES; i++) {
      await Attributes.create({
        name: "TestAttribute",
        owner: "henry.burgess@wustl.edu",
        archived: false,
        description: `Test Attribute ${i}`,
        values: [],
      });
    }

    // Get all Attributes and confirm length
    const result = await Attributes.all();
    expect(result.length).toBe(NUM_ATTRIBUTES);

    // Get half of all identifiers and request Attributes with those identifiers
    const identifiers: string[] = result
      .slice(0, NUM_ATTRIBUTES / 2)
      .map((attribute) => attribute._id);
    const resultMany = await Attributes.getMany(identifiers);

    // Check result length and contents are matching what was requested
    expect(resultMany.length).toBe(NUM_ATTRIBUTES / 2);
    expect(resultMany.map((attribute) => attribute._id)).toEqual(
      expect.arrayContaining(identifiers),
    );
  });

  it("should confirm an Attribute exists", async () => {
    const result: ResponseMessage = await Attributes.create({
      name: "TestAttribute",
      owner: "henry.burgess@wustl.edu",
      archived: false,
      description: "Attribute description",
      values: [],
    });
    const identifier = result.message;

    const exists = await Attributes.exists(identifier);
    expect(exists).toBeTruthy();
  });

  it("should confirm an Attribute does not exist", async () => {
    const exists = await Attributes.exists("noID");
    expect(exists).toBeFalsy();
  });

  it("should update the Attribute description", async () => {
    const result: ResponseMessage = await Attributes.create({
      name: "TestAttribute",
      owner: "henry.burgess@wustl.edu",
      archived: false,
      description: "Attribute description",
      values: [],
    });
    const identifier = result.message;

    const attribute = await Attributes.getOne(identifier);
    expect(attribute).not.toBeNull();
    if (attribute) {
      await Attributes.update({
        _id: identifier,
        archived: false,
        timestamp: dayjs(Date.now()).toISOString(),
        name: attribute.name,
        owner: "henry.burgess@wustl.edu",
        description: "Updated Attribute description",
        values: attribute.values,
      });
    }

    const updated = await Attributes.getOne(identifier);
    expect(updated).not.toBeNull();
    if (updated) {
      expect(updated.description).toBe("Updated Attribute description");
    }
  });

  it("should update the Attribute values", async () => {
    const result: ResponseMessage = await Attributes.create({
      name: "TestAttribute",
      owner: "henry.burgess@wustl.edu",
      archived: false,
      description: "Attribute description",
      values: [],
    });
    expect(result.success).toBeTruthy();
    const identifier = result.message;

    const attribute = await Attributes.getOne(identifier);
    expect(attribute).not.toBeNull();
    if (attribute) {
      const update: ResponseMessage = await Attributes.update({
        _id: identifier,
        archived: false,
        name: attribute.name,
        owner: "henry.burgess@wustl.edu",
        timestamp: dayjs(Date.now()).toISOString(),
        description: attribute.description,
        values: [
          {
            _id: "v_0",
            name: "Value0",
            type: "text",
            data: "Test",
          },
        ],
      });
      expect(update.success).toBeTruthy();
    }

    const updated = await Attributes.getOne(identifier);
    expect(updated).not.toBeNull();
    if (updated) {
      expect(updated.values.length).toBe(1);
      expect(updated.values[0].name).toBe("Value0");
      expect(updated.values[0].type).toBe("text");
      expect(updated.values[0].data).toBe("Test");
    }
  });

  it("should archive an Attribute", async () => {
    const result: ResponseMessage = await Attributes.create({
      name: "TestAttribute",
      owner: "henry.burgess@wustl.edu",
      archived: false,
      description: "Attribute description",
      values: [],
    });
    expect(result.success).toBeTruthy();
    const identifier = result.message;

    // Archive the Attribute and validate it has been archived
    await Attributes.setArchived(identifier, true);
    const attribute: AttributeModel | null =
      await Attributes.getOne(identifier);
    expect(attribute).not.toBeNull();
    if (attribute) {
      expect(attribute.archived).toBeTruthy();
    }
  });

  it("should restore an Attribute", async () => {
    const result: ResponseMessage = await Attributes.create({
      name: "TestAttribute",
      owner: "henry.burgess@wustl.edu",
      archived: false,
      description: "Attribute description",
      values: [],
    });
    expect(result.success).toBeTruthy();
    const identifier = result.message;

    // Archive the Attribute and validate it has been archived
    await Attributes.setArchived(identifier, true);
    const attribute: AttributeModel | null =
      await Attributes.getOne(identifier);
    expect(attribute).not.toBeNull();
    if (attribute) {
      expect(attribute.archived).toBeTruthy();
    }

    // Restore the Attribute and validate it has been restored
    await Attributes.setArchived(identifier, false);
    const restored: AttributeModel | null = await Attributes.getOne(identifier);
    expect(restored).not.toBeNull();
    if (restored) {
      expect(restored.archived).toBeFalsy();
    }
  });

  it("should delete an Attribute", async () => {
    const result: ResponseMessage = await Attributes.create({
      name: "TestAttribute",
      owner: "henry.burgess@wustl.edu",
      archived: false,
      description: "Attribute description",
      values: [],
    });
    expect(result.success).toBeTruthy();
    const identifier = result.message;

    // Archive the Attribute and validate it has been archived
    const deleted: ResponseMessage = await Attributes.delete(identifier);
    expect(deleted.success).toBeTruthy();

    // Assert that the Attribute does not exist
    const exists = await Attributes.exists(identifier);
    expect(exists).toBeFalsy();
  });
});
