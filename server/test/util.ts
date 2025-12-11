// Utility functions and libraries
import { connect, disconnect, getDatabase } from "../src/connectors/database";

// Import seed function from seed directory
import { seedTestDatabase } from "../src/seed/seedTestDatabase";

/**
 * Utility wrapper function to seed complete database
 */
export const setupDatabase = async (): Promise<void> => {
  await connect();
  await seedTestDatabase();
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
