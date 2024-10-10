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

export const setupDatabase = async (): Promise<void> => {
  await connect();
  await seedDatabase();
  await disconnect();
};

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
    collaborators: [],
    description: "This is a test Workspace",
    entities: [],
    projects: [],
    attributes: [],
    activity: [],
  });
  if (workspaceResult.success === false)
    throw new Error("Error creating Workspace");

  // Create a User
  const userResult: IResponseMessage = await Users.create({
    _id: DEMO_USER_ORCID,
    firstName: "Demo",
    lastName: "User",
    email: "demo@metadatify.com",
    affiliation: "Demo Affiliation",
    workspaces: [workspaceResult.data],
    token: "",
  });
  if (userResult.success === false) throw new Error("Error creating User");

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

  // Create Origin and Product Entities
  const originResult: ResponseData<string> = await Entities.create({
    name: "Test Origin Entity",
    created: dayjs(Date.now()).toISOString(),
    archived: false,
    owner: DEMO_USER_ORCID,
    description: "Description for test Origin Entity",
    projects: [projectResult.data],
    associations: {
      origins: [],
      products: [],
    },
    attributes: [],
    attachments: [],
    history: [],
  });
  await Workspaces.addEntity(workspaceResult.data, originResult.data);

  const productResult: ResponseData<string> = await Entities.create({
    name: "Test Product Entity",
    created: dayjs(Date.now()).toISOString(),
    archived: false,
    owner: DEMO_USER_ORCID,
    description: "Description for test Product Entity",
    projects: [projectResult.data],
    associations: {
      origins: [
        {
          _id: originResult.data,
          name: "Test Origin Entity",
        },
      ],
      products: [],
    },
    attributes: [],
    attachments: [],
    history: [],
  });
  await Workspaces.addEntity(workspaceResult.data, productResult.data);

  // Create Entity with Attributes
  const entityResult: ResponseData<string> = await Entities.create({
    name: "Test Entity",
    created: dayjs(Date.now()).toISOString(),
    archived: false,
    owner: DEMO_USER_ORCID,
    description: "Description for test Entity",
    projects: [projectResult.data],
    associations: {
      origins: [],
      products: [],
    },
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
              _id: originResult.data,
              name: "Test Origin Entity",
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
};

/**
 * Utility to clear the local database during testing
 * @return {Promise<void>}
 */
export const clearDatabase = async (): Promise<void> => {
  await getDatabase().collection("activity").deleteMany({});
  await getDatabase().collection("attributes").deleteMany({});
  await getDatabase().collection("entities").deleteMany({});
  await getDatabase().collection("projects").deleteMany({});
  await getDatabase().collection("workspaces").deleteMany({});
  await getDatabase().collection("users").deleteMany({});
};
