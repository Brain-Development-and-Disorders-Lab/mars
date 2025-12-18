// .env configuration
import "dotenv/config";

// Jest imports
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

// Project model and types
import { Projects } from "@models/Projects";
import { ProjectModel, ResponseData } from "@types";

// Database connectivity
import { connect, disconnect } from "@connectors/database";
import { clearDatabase } from "./util";

import dayjs from "dayjs";

describe("Project model", () => {
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

  it("should return 0 Project entries with an empty database", async () => {
    const result = await Projects.all();
    expect(result.length).toBe(0);
  });

  it("should create a Project", async () => {
    const result: ResponseData<string> = await Projects.create({
      name: "TestProject",
      archived: false,
      created: dayjs(Date.now()).toISOString(),
      owner: "henry.burgess@wustl.edu",
      description: "Test Project",
      entities: [],
      collaborators: [],
      history: [],
    });
    expect(result.success).toBeTruthy();

    const project: ProjectModel | null = await Projects.getOne(result.data);
    expect(project).not.toBeNull();
  });

  it("should return multiple requested Project entries", async () => {
    // Create a set of Project entries
    const NUM_PROJECTS = 4;
    for (let i = 0; i < NUM_PROJECTS; i++) {
      await Projects.create({
        name: `TestProject_${i}`,
        archived: false,
        created: dayjs(Date.now()).toISOString(),
        owner: "henry.burgess@wustl.edu",
        description: `Test Project ${i}`,
        entities: [],
        collaborators: [],
        history: [],
      });
    }

    // Get all Projects and confirm length
    const result = await Projects.all();
    expect(result.length).toBe(NUM_PROJECTS);

    // Get half of all identifiers and request Projects with those identifiers
    const identifiers: string[] = result
      .slice(0, NUM_PROJECTS / 2)
      .map((project) => project._id);
    const resultMany = await Projects.getMany(identifiers);

    // Check result length and contents are matching what was requested
    expect(resultMany.length).toBe(NUM_PROJECTS / 2);
    expect(resultMany.map((project) => project._id)).toEqual(
      expect.arrayContaining(identifiers),
    );
  });

  it("should confirm a Project exists", async () => {
    const result: ResponseData<string> = await Projects.create({
      name: "TestProject",
      archived: false,
      created: dayjs(Date.now()).toISOString(),
      owner: "henry.burgess@wustl.edu",
      description: "Test Project",
      entities: [],
      collaborators: [],
      history: [],
    });

    const exists = await Projects.exists(result.data);
    expect(exists).toBeTruthy();
  });

  it("should confirm a Project does not exist", async () => {
    const exists = await Projects.exists("noID");
    expect(exists).toBeFalsy();
  });
});
