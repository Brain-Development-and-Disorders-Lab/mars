// Seed script to generate minimal test data for MongoDB (used in test suite)
import "dotenv/config";
import { connect, disconnect } from "../connectors/database";
import { Entities } from "../models/Entities";
import { Projects } from "../models/Projects";
import { Templates } from "../models/Templates";
import { Users } from "../models/Users";
import { Workspaces } from "../models/Workspaces";
import dayjs from "dayjs";
import consola from "consola";
import { IResponseMessage, ResponseData } from "@types";
import { DEMO_USER_ORCID } from "../variables";

/**
 * Utility to seed the database with minimal testing values
 * Creates a workspace, project, entities, template, and user for testing
 */
export const seedTestDatabase = async (): Promise<void> => {
  // Create a Workspace
  const workspaceResult: ResponseData<string> = await Workspaces.create({
    name: "Test Workspace",
    owner: DEMO_USER_ORCID,
    public: false,
    collaborators: [],
    description: "This is a test Workspace",
    entities: [],
    projects: [],
    templates: [],
    activity: [],
  });
  if (workspaceResult.success === false)
    throw new Error("Error creating Workspace");

  // Create a Project
  const projectResult: ResponseData<string> = await Projects.create({
    name: "Test Project",
    owner: DEMO_USER_ORCID,
    archived: false,
    created: dayjs(Date.now()).toISOString(),
    collaborators: [],
    description: "Description for Test Project",
    entities: [],
    history: [],
  });
  if (projectResult.success === false)
    throw new Error("Error creating Project");
  await Workspaces.addProject(workspaceResult.data, projectResult.data);

  // Create parent and child Entities
  const parentResult: ResponseData<string> = await Entities.create({
    name: "Test Parent Entity",
    created: dayjs(Date.now()).toISOString(),
    archived: false,
    owner: DEMO_USER_ORCID,
    description: "Description for test Parent Entity",
    projects: [projectResult.data],
    relationships: [],
    attributes: [],
    attachments: [],
    history: [],
  });
  await Workspaces.addEntity(workspaceResult.data, parentResult.data);

  const childResult: ResponseData<string> = await Entities.create({
    name: "Test Child Entity",
    created: dayjs(Date.now()).toISOString(),
    archived: false,
    owner: DEMO_USER_ORCID,
    description: "Description for test Child Entity",
    projects: [projectResult.data],
    relationships: [
      {
        target: {
          _id: parentResult.data,
          name: "Test Parent Entity",
        },
        source: {
          _id: "no_id",
          name: "Test Child Entity",
        },
        type: "parent",
      },
    ],
    attributes: [],
    attachments: [],
    history: [],
  });
  await Workspaces.addEntity(workspaceResult.data, childResult.data);

  // Create Entity with Attributes
  const entityResult: ResponseData<string> = await Entities.create({
    name: "Test Entity",
    created: dayjs(Date.now()).toISOString(),
    archived: false,
    owner: DEMO_USER_ORCID,
    description: "Description for test Entity",
    projects: [projectResult.data],
    relationships: [],
    attributes: [
      {
        _id: "a-ndl2n3k",
        archived: false,
        name: "Test Attribute",
        owner: DEMO_USER_ORCID,
        timestamp: dayjs(Date.now()).toISOString(),
        description: "Test Attribute description",
        values: [
          {
            _id: "v-00",
            name: "Test Text Value",
            type: "text",
            data: "Test Value",
          },
          {
            _id: "v-00",
            name: "Test Date Value",
            type: "date",
            data: "2024-10-10",
          },
          {
            _id: "v-00",
            name: "Test Number Value",
            type: "number",
            data: 123,
          },
          {
            _id: "v-00",
            name: "Test URL Value",
            type: "url",
            data: "https://mynotebook.labarchives.com",
          },
          {
            _id: "v-00",
            name: "Test Entity Value",
            type: "entity",
            data: {
              _id: parentResult.data,
              name: "Test Parent Entity",
            },
          },
          {
            _id: "v-00",
            name: "Test Select Value",
            type: "select",
            data: {
              options: ["Option A", "Option B"],
              selected: "Option A",
            },
          },
        ],
      },
    ],
    attachments: [],
    history: [],
  });
  await Workspaces.addEntity(workspaceResult.data, entityResult.data);

  // Create a Template
  const templateResult: ResponseData<string> = await Templates.create({
    name: "Test Template",
    archived: false,
    owner: DEMO_USER_ORCID,
    description: "Description for test Template",
    values: [
      {
        _id: "v-00",
        name: "Test Value",
        type: "text",
        data: "Test",
      },
    ],
  });
  await Workspaces.addTemplate(workspaceResult.data, templateResult.data);

  // Create a User
  const userResult: IResponseMessage = await Users.create({
    _id: DEMO_USER_ORCID,
    firstName: "Demo",
    lastName: "User",
    email: "demo@metadatify.com",
    affiliation: "Demo Affiliation",
    workspaces: [workspaceResult.data],
    lastLogin: "",
    api_keys: [],
    token: "",
  });
  if (userResult.success === false) throw new Error("Error creating User");
};

/**
 * Main seeding function - can be run standalone or imported
 */
async function seedDatabase(): Promise<void> {
  try {
    consola.start("Starting test database seeding...");

    // Connect to database
    await connect();
    consola.success("Connected to database");

    // Seed the database
    await seedTestDatabase();

    consola.success("Test database seeding completed successfully!");

    await disconnect();
  } catch (error) {
    consola.error("Error seeding test database:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      consola.success("Test seeding script completed");
      process.exit(0);
    })
    .catch((error) => {
      consola.error("Test seeding script failed:", error);
      process.exit(1);
    });
}

export { seedDatabase };
