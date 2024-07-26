import { getDatabase } from "../src/connectors/database";

/**
 * Utility to clear the local database during testing
 * @return {Promise<void>}
 */
export const clearDatabase = async (): Promise<void> => {
  await getDatabase().collection("attributes").deleteMany({});
  await getDatabase().collection("collections").deleteMany({});
  await getDatabase().collection("entities").deleteMany({});
  await getDatabase().collection("projects").deleteMany({});
  await getDatabase().collection("activity").deleteMany({});
};
