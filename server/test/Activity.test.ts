// .env configuration
import "dotenv/config";

// Jest imports
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

// Activity model and types
import { Activity } from "../src/models/Activity";

// Database connectivity
import { connect, disconnect } from "../src/connectors/database";
import { clearDatabase, setupWorkspace } from "./util";

describe("Activity model", () => {
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

  it("should return 2 Activity entries with a new Workspace", async () => {
    const result = await Activity.all();
    expect(result.length).toBe(2);
  });

  it("should create a new Activity entry", async () => {
    const create = await Activity.create(
      {
        timestamp: new Date(),
        type: "create",
        actor: {
          name: "Test",
          _id: "test",
        },
        details: "Test Activity",
        target: {
          type: "entities",
          _id: "test",
          name: "Test Target",
        },
      },
      workspace,
    );
    expect(create.success).toBeTruthy();

    // Results should include new Activity entry as well as existing entries
    const result = await Activity.all();
    expect(result.length).toBe(3);
  });
});
