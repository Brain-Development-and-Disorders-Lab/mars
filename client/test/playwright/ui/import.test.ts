// Playwright imports
import test, { expect } from "@playwright/test";

// Test helper functions
import { performLogin, selectDropdownOption, clickButtonWhenEnabled, setupEnvironment } from "../helpers";

// Other imports
import * as path from "path";

test.describe("Import", () => {
  test.beforeEach(async ({ page }) => {
    // Increase timeouts for CI workflows
    test.setTimeout(60000);

    // Ensure the user is logged in
    await performLogin(page);

    // Perform setup of the test environment
    await setupEnvironment(page, "import");

    // Navigate to the dashboard
    await page.goto("/");
  });

  test.describe("Files", () => {
    test("should import a CSV file successfully", async ({ page }) => {
      await page.goto("/");
      await clickButtonWhenEnabled(page, "#navImportButtonDesktop");

      // Upload CSV file - relative to project root
      const csvPath = path.resolve(process.cwd(), "test/playwright/fixtures/export_entities.csv");
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(csvPath);

      await selectDropdownOption(page, '[data-testid="import-type-select-trigger"]', "Entities");

      await clickButtonWhenEnabled(page, "#importContinueButton");

      // Wait for details page to load before selecting columns
      await page.waitForLoadState("networkidle");

      await selectDropdownOption(page, '[data-testid="import-column-select-trigger-name"]', "Name");
      await selectDropdownOption(page, '[data-testid="import-column-select-trigger-project"]', "Example Project");

      // Continue through remaining steps
      await clickButtonWhenEnabled(page, "#importContinueButton"); // Attributes page
      await clickButtonWhenEnabled(page, "#importContinueButton"); // Review page
      await clickButtonWhenEnabled(page, "#importContinueButton"); // Finalize

      // Verify import success
      await page.click("#navProjectsButtonDesktop");
      await page.locator(".data-table-scroll-container").locator('button[aria-label="View Project"]').first().click();

      await expect(page.locator("text=Mini Box 1 (CSV)")).toBeVisible();
    });

    test("should import a JSON file successfully", async ({ page }) => {
      await page.goto("/");
      await clickButtonWhenEnabled(page, "#navImportButtonDesktop");

      // Upload JSON file - relative to project root
      const jsonPath = path.resolve(process.cwd(), "test/playwright/fixtures/export_entities.json");
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(jsonPath);

      await selectDropdownOption(page, '[data-testid="import-type-select-trigger"]', "Entities");

      // Wait for continue button to be enabled
      await clickButtonWhenEnabled(page, "#importContinueButton");
      await page.locator("input[placeholder='\"name\"']").first().waitFor({ state: "visible", timeout: 15000 });
      await page.waitForLoadState("networkidle");

      await clickButtonWhenEnabled(page, "#importContinueButton");

      await page
        .locator("text=Existing Attributes defined in JSON will be preserved")
        .waitFor({ state: "visible", timeout: 10000 });
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
