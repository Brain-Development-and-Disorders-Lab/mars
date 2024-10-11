// Required for reading environment variables
import "dotenv/config";

// Import Cypress
import cypress from "cypress";

// Database setup and teardown functions
import { setupDatabase, teardownDatabase } from "../server/test/util";

export default cypress.defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on("task", {
        // Database setup task
        "database:setup": () => {
          return new Promise((resolve) => {
            setupDatabase().then(() => resolve(null));
          });
        },
        // Database teardown task
        "database:teardown": () => {
          return new Promise((resolve) => {
            teardownDatabase().then(() => resolve(null));
          });
        },
      });
    },
    specPattern: "test/cypress/tests/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "test/cypress/support/database.{js,jsx,ts,tsx}",
  },
});
