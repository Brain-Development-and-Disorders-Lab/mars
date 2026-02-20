import { test as setup } from "@playwright/test";
import { setupDatabase, teardownDatabase } from "../../../server/test/util";

// Access environment variables
import "dotenv/config";

// Test helpers
import { selectDropdownOption } from "./helpers";

setup("create new user", async ({ page }) => {
  // Setup database once before all tests
  await teardownDatabase();
  await setupDatabase();

  // Access the baseURL from the config file if needed
  await page.goto("/login");
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  await page.waitForLoadState("domcontentloaded");

  // Create user account
  await page
    .locator("#createAccountButton")
    .waitFor({ state: "visible", timeout: 10000 });
  await page.click("#createAccountButton");
  await page.waitForLoadState("domcontentloaded");

  // Populate user information (use environment variables for specific details)
  await page.locator("#userFirstNameInput").fill("User");
  await page.locator("#userLastNameInput").fill("Test");
  await page
    .locator("#userEmailInput")
    .fill(process.env.TEST_USER_EMAIL || "test@test.com");
  await selectDropdownOption(
    page,
    '[data-testid="affiliation-select-trigger"]',
    "No Affiliation",
  );
  await page
    .locator("#userPasswordInputInitial")
    .fill(process.env.TEST_USER_PASSWORD || "test_password123");
  await page
    .locator("#userPasswordInputConfirm")
    .fill(process.env.TEST_USER_PASSWORD || "test_password123");

  // Finalize account creation
  await page.locator("#createAccountButton").click();

  // Create a Workspace
  await page.locator("#modalWorkspaceName").fill("Test Workspace");
  await page.locator("#modalWorkspaceCreateButton").click();
});
