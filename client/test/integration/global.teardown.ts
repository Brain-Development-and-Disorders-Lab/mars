// Playwright imports
import { test as teardown } from "@playwright/test";

// Test helpers
import { resetWorkspace } from "./helpers/global.helpers";

teardown("test teardown", async ({ page }) => {
  await resetWorkspace(page);
});
