// Required for reading environment variables
import "dotenv/config";

// Import Cypress
import cypress from "cypress";

// Database setup and teardown functions
import {
  clearUsers,
  setupDatabase,
  teardownDatabase,
} from "../server/test/util";

export default cypress.defineConfig({
  e2e: {
    setupNodeEvents(on) {
      on("task", {
        // Database setup tasks
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
        // Database clear users task
        "database:delete:users": () => {
          return new Promise((resolve) => {
            clearUsers().then(() => resolve(null));
          });
        },
      });
    },
    fixturesFolder: "test/cypress/fixtures",
    specPattern: "test/cypress/tests/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "test/cypress/support/database.{js,jsx,ts,tsx}",
    screenshotsFolder: "test/cypress/screenshots",
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 4000,
    requestTimeout: 5000,
    responseTimeout: 30000,
  },
});
