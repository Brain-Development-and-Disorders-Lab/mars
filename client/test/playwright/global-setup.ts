import { setupDatabase, teardownDatabase } from "../../../server/test/util";

async function globalSetup() {
  // Setup database once before all tests
  await teardownDatabase();
  await setupDatabase();
}

export default globalSetup;
