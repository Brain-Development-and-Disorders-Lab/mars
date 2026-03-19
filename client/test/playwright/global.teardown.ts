// Playwright imports
import { test as teardown } from "@playwright/test";

// Test helpers
import { resetEnvironment } from "./helpers";

teardown("test teardown", async ({ page }) => {
  await resetEnvironment(page);
});
