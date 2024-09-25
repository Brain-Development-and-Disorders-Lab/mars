// .env configuration
import "dotenv/config";

// Jest imports
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

// Activity model and types
import { Activity } from "../src/models/Activity";

import dayjs from "dayjs";

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
    await Activity.create({
      timestamp: dayjs(Date.now()).toISOString(),
      type: "create",
      actor: "test",
      details: "Test Activity",
      target: {
        type: "entities",
        _id: "test",
        name: "Test Target",
      },
    });

    // Results should include new Activity entry as well as existing entries
    const result = await Activity.all();
    expect(result.length).toBe(1);
  });

  it("should return multiple requested Activity entries", async () => {
    // Create a set of Activity entries
    const NUM_ACTIVITY = 4;
    for (let i = 0; i < NUM_ACTIVITY; i++) {
      await Activity.create({
        timestamp: dayjs(Date.now()).toISOString(),
        type: "create",
        actor: "test",
        details: `Test Activity ${i}`,
        target: {
          type: "entities",
          _id: "test",
          name: "Test Target",
        },
      });
    }

    // Get all Activity and confirm length
    const result = await Activity.all();
    expect(result.length).toBe(NUM_ACTIVITY);

    // Get half of all identifiers and request Activity with those identifiers
    const identifiers: string[] = result
      .slice(0, NUM_ACTIVITY / 2)
      .map((activity) => activity._id);
    const resultMany = await Activity.getMany(identifiers);

    // Check result length and contents are matching what was requested
    expect(resultMany.length).toBe(NUM_ACTIVITY / 2);
    expect(resultMany.map((activity) => activity._id)).toEqual(
      expect.arrayContaining(identifiers),
    );
  });
});
