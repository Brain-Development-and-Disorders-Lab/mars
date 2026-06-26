// Playwright imports
import test, { expect } from "@playwright/test";

// Test helper functions
import {
  selectMenuOption,
  clickButtonWhenEnabled,
  createTestUser,
  createTestWorkspace,
  switchWorkspace,
  createTestProject,
} from "../helpers";

// Other imports
import * as path from "path";

test.describe("Import", () => {
  test.describe("Files", () => {
    test.beforeEach(async ({ context, page }) => {
      // Create User
      const user = await createTestUser(context);

      // Setup Workspace
      const workspace = await createTestWorkspace("Import-1", user);
      await createTestProject("Test Project", user, workspace);

      // Setup navigation
      await switchWorkspace(page, "Import-1");
      await page.goto("/");
    });

    test("should import a CSV file successfully", async ({ page }) => {
      await clickButtonWhenEnabled(page, "#navImportButtonDesktop");

      // Upload CSV file
      const csvPath = path.resolve(process.cwd(), "test/integration/export_entities.csv");
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(csvPath);

      await page.click('[data-testid="import-type-select-trigger-entities"]');

      await clickButtonWhenEnabled(page, "#importContinueButton");

      // Wait for details page to load before selecting columns
      await page.waitForLoadState("networkidle");

      await selectMenuOption(page, '[data-testid="import-column-select-trigger-name"]', "Name");
      await selectMenuOption(page, '[data-testid="import-column-select-trigger-project"]', "Test Project");

      // Continue through remaining steps
      await clickButtonWhenEnabled(page, "#importContinueButton"); // Attributes page
      await clickButtonWhenEnabled(page, "#importContinueButton"); // Review page
      await clickButtonWhenEnabled(page, "#importContinueButton"); // Finalize

      // Verify import success
      await page.click("#navProjectsButtonDesktop");
      await page
        .getByTestId("data-table-scroll-container")
        .locator('button[aria-label="View Project"]')
        .first()
        .click();

      await expect(page.locator("text=Mini Box 1 (CSV)").first()).toBeVisible();
    });

    test("should import a JSON file successfully", async ({ page }) => {
      await clickButtonWhenEnabled(page, "#navImportButtonDesktop");

      // Upload JSON file
      const jsonPath = path.resolve(process.cwd(), "test/integration/export_entities.json");
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(jsonPath);

      await page.click('[data-testid="import-type-select-trigger-entities"]');

      // Wait for continue button to be enabled
      await clickButtonWhenEnabled(page, "#importContinueButton");
      await page.locator("input[placeholder='JSON: \"name\"']").first().waitFor({ state: "visible", timeout: 15000 });
      await page.waitForLoadState("networkidle");

      await clickButtonWhenEnabled(page, "#importContinueButton");

      await page.locator("text=No Attributes added").waitFor({ state: "visible", timeout: 10000 });
      await page.waitForLoadState("networkidle");

      await clickButtonWhenEnabled(page, "#importContinueButton");

      await page.locator('button:has-text("Finish")').waitFor({ state: "visible", timeout: 15000 });
      await page.waitForLoadState("networkidle");

      await clickButtonWhenEnabled(page, "#importContinueButton");

      // Verify import success
      await page.click("#navEntitiesButtonDesktop");
      await expect(page.locator("text=(JSON)")).toBeVisible();
    });
  });
});
