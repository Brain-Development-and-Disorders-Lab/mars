// Database imports
import { connect, disconnect, getDatabase, getClient } from "@connectors/database";

// Import models for workspace creation
import { Workspaces } from "@models/Workspaces";
import { Entities } from "@models/Entities";
import { Projects } from "@models/Projects";
import { Templates } from "@models/Attributes";

// Utility functions
import dayjs from "dayjs";

// Custom types
import { ResponseData } from "@types";

// Variables
const TEST_USER_ID = "6a19ffaa2cc44416e51e3158";

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
  await getDatabase().collection("account").deleteMany({});
  await getDatabase().collection("activity").deleteMany({});
  await getDatabase().collection("counters").deleteMany({});
  await getDatabase().collection("entities").deleteMany({});
  await getDatabase().collection("projects").deleteMany({});
  await getDatabase().collection("session").deleteMany({});
  await getDatabase().collection("templates").deleteMany({});
  await getDatabase().collection("user").deleteMany({});
  await getDatabase().collection("verification").deleteMany({});
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
export const createTestWorkspace = async (workspaceName: string): Promise<string> => {
  await ensureConnection();

  const workspaceResult: ResponseData<string> = await Workspaces.create({
    name: workspaceName,
    owner: TEST_USER_ID,
    isPublic: false,
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
    owner: TEST_USER_ID,
    archived: false,
    created: dayjs(Date.now()).toISOString(),
    description: "Description for Test Project",
    entities: [],
    history: [],
  });
  if (projectResult.success === false) throw new Error("Error creating Project");
  await Workspaces.addProject(workspaceId, projectResult.data);

  // Create parent and child Entities
  const parentResult: ResponseData<string> = await Entities.create({
    name: "Test Parent Entity",
    created: dayjs(Date.now()).toISOString(),
    archived: false,
    owner: TEST_USER_ID,
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
    owner: TEST_USER_ID,
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
    owner: TEST_USER_ID,
    description: "Description for test Entity",
    projects: [projectResult.data],
    relationships: [],
    attributes: [
      {
        _id: "a-ndl2n3k",
        archived: false,
        name: "Test Attribute",
        owner: TEST_USER_ID,
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
            data: "123",
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
            data: JSON.stringify({
              _id: parentResult.data,
              name: "Test Parent Entity",
            }),
          },
          {
            _id: "v-00",
            name: "Test Select Value",
            type: "select",
            data: JSON.stringify({
              options: ["Option A", "Option B"],
              selected: "Option A",
            }),
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
    owner: TEST_USER_ID,
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

  return workspaceId;
};

/**
 * Create a single Entity with attributes required for query builder tests.
 * The attribute values are chosen to satisfy all query test cases:
 * text "Test Value", number "10" (>5, <15, equals 10), date "2026-03-19".
 * @param workspaceId Workspace to associate the entity with
 */
export const createQueryTestEntity = async (workspaceId: string): Promise<void> => {
  await ensureConnection();

  const entityResult: ResponseData<string> = await Entities.create({
    name: "Test Entity",
    created: dayjs(Date.now()).toISOString(),
    archived: false,
    owner: TEST_USER_ID,
    description: "Entity for query builder tests",
    projects: [],
    relationships: [],
    attributes: [
      {
        _id: "a-query-test",
        archived: false,
        name: "Test Attribute",
        owner: TEST_USER_ID,
        timestamp: dayjs(Date.now()).toISOString(),
        description: "Test Attribute description",
        values: [
          { _id: "v-text", name: "Test Text Value", type: "text", data: "Test Value" },
          { _id: "v-number", name: "Test Number Value", type: "number", data: "10" },
          { _id: "v-date", name: "Test Date Value", type: "date", data: "2026-03-19" },
        ],
      },
    ],
    attachments: [],
    history: [],
  });

  if (entityResult.success === false) {
    throw new Error(`Error creating query test Entity: ${entityResult.message}`);
  }

  await Workspaces.addEntity(workspaceId, entityResult.data);
};

/**
 * Create a Better Auth instance using an active MongoDB database connection.
 * Called after connect() so getDatabase() returns a live instance
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _auth: any = null;
export const getAuth = async () => {
  if (!_auth) {
    const { betterAuth } = await import("better-auth");
    const { nanoid } = await import("nanoid");
    const { mongodbAdapter } = await import("better-auth/adapters/mongodb");
    const { testUtils } = await import("better-auth/plugins");
    const { admin } = await import("better-auth/plugins/admin");
    _auth = betterAuth({
      advanced: {
        database: {
          generateId: () => nanoid(),
        },
      },
      database: mongodbAdapter(getDatabase(), {
        client: getClient(),
        transaction: false,
      }),
      basePath: "/auth",
      baseURL: "http://127.0.0.1:8000",
      trustedOrigins: ["http://127.0.0.1:8080"],
      account: {
        accountLinking: {
          allowDifferentEmails: true,
        },
      },
      session: {
        cookieCache: {
          enabled: true,
          maxAge: 5 * 60, // 5 minutes
        },
      },
      plugins: [admin(), testUtils()],
      user: {
        modelName: "user",
        deleteUser: {
          enabled: true,
        },
        additionalFields: {
          firstName: {
            type: "string",
          },
          lastName: {
            type: "string",
          },
          affiliation: {
            type: "string",
          },
          lastLogin: {
            type: "string",
          },
          hasSeenWalkthrough: {
            type: "boolean",
            defaultValue: false,
          },
          api_keys: {
            type: "string",
          },
          account_orcid: {
            type: "string",
          },
          completedProfile: {
            type: "boolean",
            defaultValue: false,
          },
        },
      },
    });
  }
  return _auth;
};
