// Playwright imports
import { test as setup } from "@playwright/test";

// Test helpers
import { resetWorkspace } from "./helpers";

setup("test setup", async ({ page }) => {
  await resetWorkspace(page);
});
