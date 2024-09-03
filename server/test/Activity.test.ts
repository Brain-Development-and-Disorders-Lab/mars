// .env configuration
import "dotenv/config";

// Jest imports
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

// Activity model and types
import { Activity } from "../src/models/Activity";

// Database connectivity
import { connect, disconnect } from "../src/connectors/database";
import { clearDatabase } from "./util";

describe("Activity model", () => {
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

  it("should return 0 Activity entries with an empty database", async () => {
    const result = await Activity.all();
    expect(result.length).toBe(0);
  });

  it("should create a new Activity entry", async () => {
    const create = await Activity.create({
      timestamp: new Date(),
      type: "create",
      actor: "test",
      details: "Test Activity",
      target: {
        type: "entities",
        _id: "test",
        name: "Test Target",
      },
    });
    expect(create.success).toBeTruthy();

    // Results should include new Activity entry as well as existing entries
    const result = await Activity.all();
    expect(result.length).toBe(1);
  });
});
