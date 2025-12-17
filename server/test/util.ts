// Utility functions and libraries
import { connect, disconnect, getDatabase } from "../src/connectors/database";

// Import seed function from seed directory
import { seedTestDatabase } from "../src/seed/seedTestDatabase";

// Import models for workspace creation
import { Workspaces } from "../src/models/Workspaces";
import { Entities } from "../src/models/Entities";
import { Projects } from "../src/models/Projects";
import { Templates } from "../src/models/Templates";
import { Users } from "../src/models/Users";
import dayjs from "dayjs";
import { DEMO_USER_ORCID } from "../src/variables";
import { ResponseData } from "@types";

// Track connection state to avoid unnecessary connects/disconnects
let isConnected = false;
let connectionPromise: Promise<void> | null = null;

/**
 * Ensure database connection is established, reusing existing connection if available
 */
const ensureConnection = async (): Promise<void> => {
  if (isConnected) {
    return;
  }

  // If a connection is already in progress, wait for it
  if (connectionPromise) {
    await connectionPromise;
    return;
  }

  connectionPromise = (async () => {
    await connect();
    isConnected = true;
    connectionPromise = null;
  })();

  await connectionPromise;
};

/**
 * Utility wrapper function to seed complete database
 */
export const setupDatabase = async (): Promise<void> => {
  await ensureConnection();
  await seedTestDatabase();
};

/**
 * Utility wrapper function to handle database connectivity and clearing the database
 */
export const teardownDatabase = async (): Promise<void> => {
  await ensureConnection();
  await clearDatabase();
};

/**
 * Utility to clear the users from the database during testing
 * @return {Promise<void>}
 */
export const clearUsers = async (): Promise<void> => {
  await ensureConnection();
  await getDatabase().collection("users").deleteMany({});
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

/**
 * Disconnect from database
 * @return {Promise<void>}
 */
export const closeConnection = async (): Promise<void> => {
  if (isConnected) {
    await disconnect();
    isConnected = false;
    connectionPromise = null;
  }
};

/**
 * Create a workspace with seeded test data (entities, projects, templates)
 * Similar to seedTestDatabase but creates a new workspace instead of using the default one
 * @param workspaceName Name for the workspace
 * @return {Promise<string>} Workspace ID
 */
export const createTestWorkspace = async (
  workspaceName: string,
): Promise<string> => {
  await ensureConnection();

  const workspaceResult: ResponseData<string> = await Workspaces.create({
    name: workspaceName,
    owner: DEMO_USER_ORCID,
    public: false,
    collaborators: [],
    description: `Test workspace: ${workspaceName}`,
    entities: [],
    projects: [],
    templates: [],
    activity: [],
  });

  if (workspaceResult.success === false) {
    throw new Error(`Error creating Workspace: ${workspaceResult.message}`);
  }

  const workspaceId = workspaceResult.data;

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
  await Workspaces.addProject(workspaceId, projectResult.data);

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
  await Workspaces.addEntity(workspaceId, parentResult.data);

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
  await Workspaces.addEntity(workspaceId, childResult.data);

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
  await Workspaces.addEntity(workspaceId, entityResult.data);

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
  await Workspaces.addTemplate(workspaceId, templateResult.data);

  // Ensure user has access to this workspace
  const user = await Users.getOne(DEMO_USER_ORCID);
  if (user && !user.workspaces.includes(workspaceId)) {
    user.workspaces.push(workspaceId);
    await Users.update(user);
  }

  return workspaceId;
};
