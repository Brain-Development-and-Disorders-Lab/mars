// Playwright imports
import { test as setup } from "@playwright/test";

// Test helpers
import { resetEnvironment } from "./helpers";

setup("test setup", async ({ page }) => {
  await resetEnvironment(page);
});
