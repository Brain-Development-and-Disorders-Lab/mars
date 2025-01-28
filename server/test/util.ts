// Utility functions and libraries
import dayjs from "dayjs";
import { connect, disconnect, getDatabase } from "../src/connectors/database";

// Custom types
import { IResponseMessage, ResponseData } from "../../types";

// Models
import { Entities } from "../src/models/Entities";
import { Projects } from "../src/models/Projects";
import { Users } from "../src/models/Users";
import { Workspaces } from "../src/models/Workspaces";

// Variables
import { DEMO_USER_ORCID } from "../src/variables";

/**
 * Utility wrapper function to seed complete database
 */
export const setupDatabase = async (): Promise<void> => {
  await connect();
  await seedDatabase();
  await disconnect();
};

/**
 * Utility wrapper function to handle database connectivity and clearing the database
 */
export const teardownDatabase = async (): Promise<void> => {
  await connect();
  await clearDatabase();
  await disconnect();
};

/**
 * Utility to seed the database with testing values
 */
export const seedDatabase = async (): Promise<void> => {
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
 * Utility to clear the users from the database during testing
 * @return {Promise<void>}
 */
export const clearUsers = async (): Promise<void> => {
  await connect();
  await getDatabase().collection("users").deleteMany({});
  await disconnect();
};

/**
 * Utility to clear the local database during testing
 * @return {Promise<void>}
 */
export const clearDatabase = async (): Promise<void> => {
  await getDatabase().collection("activity").deleteMany({});
  await getDatabase().collection("entities").deleteMany({});
  await getDatabase().collection("projects").deleteMany({});
  await getDatabase().collection("templates").deleteMany({});
  await getDatabase().collection("users").deleteMany({});
  await getDatabase().collection("workspaces").deleteMany({});
};
