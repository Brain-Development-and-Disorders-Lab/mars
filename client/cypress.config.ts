import cypress from "cypress";

// Database setup and teardown functions
import "dotenv/config";
import { setupDatabase, teardownDatabase } from "../server/test/util";

export default cypress.defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on("task", {
        "database:setup": () => {
          return new Promise((resolve) => {
            setupDatabase().then(() => resolve(null));
          });
        },
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
