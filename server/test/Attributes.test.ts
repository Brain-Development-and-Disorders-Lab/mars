// .env configuration
import "dotenv/config";

// Jest imports
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

// Attributes model and types
import { Attributes } from "../src/models/Attributes";

// Database connectivity
import { connect, disconnect } from "../src/connectors/database";
import { clearDatabase, setupWorkspace } from "./util";

describe("Attributes model", () => {
  let workspace = ""; // Workspace identifier used in all tests

  beforeEach(async () => {
    // Connect to the database
    await connect();

    // Clear the database prior to running tests
    await clearDatabase();

    // Create a new Workspace environment to bypass requirement
    workspace = await setupWorkspace();
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
    await Attributes.create(
      {
        name: "TestAttribute",
        description: "Attribute description",
        values: [],
      },
      workspace,
    );

    const attributes = await Attributes.all();
    expect(attributes.length).toBe(1);
  });

  it("should update the description", async () => {
    await Attributes.create(
      {
        name: "TestAttribute",
        description: "Attribute description",
        values: [],
      },
      workspace,
    );
    let attributes = await Attributes.all();
    expect(attributes.length).toBe(1);

    await Attributes.update(
      {
        _id: attributes[0]._id,
        name: attributes[0].name,
        description: "Updated Attribute description",
        values: attributes[0].values,
      },
      workspace,
    );
    attributes = await Attributes.all();

    expect(attributes.length).toBe(1);
    expect(attributes[0].description).toBe("Updated Attribute description");
  });

  it("should update the values", async () => {
    const create = await Attributes.create(
      {
        name: "TestAttribute",
        description: "Attribute description",
        values: [],
      },
      workspace,
    );
    expect(create.success).toBeTruthy();
    let attributes = await Attributes.all();

    const update = await Attributes.update(
      {
        _id: attributes[0]._id,
        name: attributes[0].name,
        description: attributes[0].description,
        values: [
          {
            _id: "v_0",
            name: "Value0",
            type: "text",
            data: "Test",
          },
        ],
      },
      workspace,
    );
    expect(update.success).toBeTruthy();
    attributes = await Attributes.all();

    expect(attributes[0].values.length).toBe(1);
    expect(attributes[0].values[0].name).toBe("Value0");
    expect(attributes[0].values[0].type).toBe("text");
    expect(attributes[0].values[0].data).toBe("Test");
  });
});
