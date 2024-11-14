// .env configuration
import "dotenv/config";

// Jest imports
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

// Template model and types
import { Templates } from "../src/models/Templates";
import { AttributeModel, IResponseMessage, ResponseData } from "../../types";

// Database connectivity
import { connect, disconnect } from "../src/connectors/database";
import { clearDatabase } from "./util";

// Utility functions
import dayjs from "dayjs";
import _ from "lodash";

describe("Templates model", () => {
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

  it("should return 0 Templates with an empty database", async () => {
    const result = await Templates.all();
    expect(result.length).toBe(0);
  });

  it("should create an Template", async () => {
    await Templates.create({
      name: "TestTemplate",
      owner: "henry.burgess@wustl.edu",
      archived: false,
      description: "Template description",
      values: [],
    });

    const templates = await Templates.all();
    expect(templates.length).toBe(1);
  });

  it("should get a Template", async () => {
    // Create a Template and store the identifier
    const result: ResponseData<string> = await Templates.create({
      name: "TestTemplate",
      owner: "henry.burgess@wustl.edu",
      archived: false,
      description: "Template description",
      values: [],
    });
    const identifier = result.data;

    // Get the Template
    const template: AttributeModel | null = await Templates.getOne(identifier);
    expect(template).not.toBeNull();
  });

  it("should return multiple requested Template entries", async () => {
    // Create a set of Template entries
    const NUM_TEMPLATES = 4;
    for (let i = 0; i < NUM_TEMPLATES; i++) {
      await Templates.create({
        name: "TestTemplate",
        owner: "henry.burgess@wustl.edu",
        archived: false,
        description: `Test Template ${i}`,
        values: [],
      });
    }

    // Get all Templates and confirm length
    const result = await Templates.all();
    expect(result.length).toBe(NUM_TEMPLATES);

    // Get half of all identifiers and request Templates with those identifiers
    const identifiers: string[] = result
      .slice(0, NUM_TEMPLATES / 2)
      .map((template) => template._id);
    const resultMany = await Templates.getMany(identifiers);

    // Check result length and contents are matching what was requested
    expect(resultMany.length).toBe(NUM_TEMPLATES / 2);
    expect(resultMany.map((template) => template._id)).toEqual(
      expect.arrayContaining(identifiers),
    );
  });

  it("should confirm a Template exists", async () => {
    const result: ResponseData<string> = await Templates.create({
      name: "TestTemplate",
      owner: "henry.burgess@wustl.edu",
      archived: false,
      description: "Template description",
      values: [],
    });
    const identifier = result.data;

    const exists = await Templates.exists(identifier);
    expect(exists).toBeTruthy();
  });

  it("should confirm an Template does not exist", async () => {
    const exists = await Templates.exists("noID");
    expect(exists).toBeFalsy();
  });

  it("should update the Template description", async () => {
    const result: ResponseData<string> = await Templates.create({
      name: "TestTemplate",
      owner: "henry.burgess@wustl.edu",
      archived: false,
      description: "Template description",
      values: [],
    });
    const identifier = result.data;

    const template = await Templates.getOne(identifier);
    expect(template).not.toBeNull();
    if (template) {
      await Templates.update({
        _id: identifier,
        archived: false,
        timestamp: dayjs(Date.now()).toISOString(),
        name: template.name,
        owner: "henry.burgess@wustl.edu",
        description: "Updated Template description",
        values: template.values,
      });
    }

    const updated = await Templates.getOne(identifier);
    if (_.isNull(updated)) throw new Error("Updated Template is null");
    expect(updated.description).toBe("Updated Template description");
  });

  it("should update the Template values", async () => {
    const result: ResponseData<string> = await Templates.create({
      name: "TestTemplate",
      owner: "henry.burgess@wustl.edu",
      archived: false,
      description: "Template description",
      values: [],
    });
    expect(result.success).toBeTruthy();
    const identifier = result.data;

    const template = await Templates.getOne(identifier);
    if (_.isNull(template)) throw new Error("Template is null");

    const update: IResponseMessage = await Templates.update({
      _id: identifier,
      archived: false,
      name: template.name,
      owner: "henry.burgess@wustl.edu",
      timestamp: dayjs(Date.now()).toISOString(),
      description: template.description,
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
    const updated = await Templates.getOne(identifier);
    if (_.isNull(updated)) throw new Error("Updated Template is null");

    expect(updated.values.length).toBe(1);
    expect(updated.values[0].name).toBe("Value0");
    expect(updated.values[0].type).toBe("text");
    expect(updated.values[0].data).toBe("Test");
  });

  it("should archive a Template", async () => {
    const result: ResponseData<string> = await Templates.create({
      name: "TestTemplate",
      owner: "henry.burgess@wustl.edu",
      archived: false,
      description: "Template description",
      values: [],
    });
    expect(result.success).toBeTruthy();
    const identifier = result.data;

    // Archive the Template and validate it has been archived
    await Templates.setArchived(identifier, true);

    const template: AttributeModel | null = await Templates.getOne(identifier);
    if (_.isNull(template)) throw new Error("Template is null");
    expect(template.archived).toBeTruthy();
  });

  it("should restore a Template", async () => {
    const result: ResponseData<string> = await Templates.create({
      name: "TestTemplate",
      owner: "henry.burgess@wustl.edu",
      archived: false,
      description: "Template description",
      values: [],
    });
    expect(result.success).toBeTruthy();
    const identifier = result.data;

    // Archive the Template and validate it has been archived
    await Templates.setArchived(identifier, true);
    const template: AttributeModel | null = await Templates.getOne(identifier);
    expect(template).not.toBeNull();
    if (template) {
      expect(template.archived).toBeTruthy();
    }

    // Restore the Template and validate it has been restored
    await Templates.setArchived(identifier, false);

    const restored: AttributeModel | null = await Templates.getOne(identifier);
    if (_.isNull(restored)) throw new Error("Template is null");
    expect(restored.archived).toBeFalsy();
  });
});
