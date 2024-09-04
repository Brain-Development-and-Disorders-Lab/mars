// Utility functions and libraries
import { getDatabase } from "../src/connectors/database";

// Models
import { Workspaces } from "../src/models/Workspaces";

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

/**
 * Utility to setup the Workspace environment prior to running tests
 * @return {Promise<string>} Workspace identifier, for use in tests
 */
export const setupWorkspace = async (): Promise<string> => {
  await Workspaces.create({
    name: "Test Workspace",
    owner: "henry.burgess@wustl.edu",
    collaborators: [],
    description: "This is a test Workspace",
    entities: [],
    projects: [],
    attributes: [],
    activity: [],
  });

  const workspace = await Workspaces.all();
  return workspace[0]._id;
};
