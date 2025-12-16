import { testWithWorkspace, expect } from "../fixtures";
import { waitForButtonEnabled, selectDropdownOption } from "../helpers";
import * as path from "path";

testWithWorkspace.describe("Import", () => {
  testWithWorkspace(
    "should import a CSV file successfully",
    async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/");
      await waitForButtonEnabled(authenticatedPage, "#navImportButtonDesktop");
      await authenticatedPage.click("#navImportButtonDesktop");

      // Upload CSV file - relative to project root
      const csvPath = path.resolve(
        process.cwd(),
        "test/playwright/fixtures/export_entities.csv",
      );
      const fileInput = authenticatedPage.locator('input[type="file"]').first();
      await fileInput.setInputFiles(csvPath);

      await selectDropdownOption(
        authenticatedPage,
        '[data-testid="import-type-select-trigger"]',
        "Entities",
      );

      await authenticatedPage
        .locator("#importContinueButton")
        .scrollIntoViewIfNeeded();
      await authenticatedPage.click("#importContinueButton");

      await selectDropdownOption(
        authenticatedPage,
        '[data-testid="import-column-select-trigger-name"]',
        "Name",
      );
      await selectDropdownOption(
        authenticatedPage,
        '[data-testid="import-column-select-trigger-project"]',
        "Test Project",
      );

      // Continue through remaining steps
      await authenticatedPage.click("#importContinueButton"); // Attributes page
      await authenticatedPage.click("#importContinueButton"); // Review page
      await authenticatedPage.click("#importContinueButton"); // Finalize

      // Verify import success
      await authenticatedPage.click("#navProjectsButtonDesktop");
      await authenticatedPage
        .locator(".data-table-scroll-container")
        .locator('button[aria-label="View Project"]')
        .first()
        .click();

      await expect(
        authenticatedPage.locator("text=Mini Box 1 (CSV)"),
      ).toBeVisible();
    },
  );

  testWithWorkspace(
    "should import a JSON file successfully",
    async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/");
      await waitForButtonEnabled(authenticatedPage, "#navImportButtonDesktop");
      await authenticatedPage.click("#navImportButtonDesktop");

      // Upload JSON file - relative to project root
      const jsonPath = path.resolve(
        process.cwd(),
        "test/playwright/fixtures/export_entities.json",
      );
      const fileInput = authenticatedPage.locator('input[type="file"]').first();
      await fileInput.setInputFiles(jsonPath);

      await selectDropdownOption(
        authenticatedPage,
        '[data-testid="import-type-select-trigger"]',
        "Entities",
      );

      await authenticatedPage
        .locator("#importContinueButton")
        .scrollIntoViewIfNeeded();
      await authenticatedPage.click("#importContinueButton"); // Column mapping
      await authenticatedPage.click("#importContinueButton"); // Attributes page
      await authenticatedPage.click("#importContinueButton"); // Review page
      await authenticatedPage.click("#importContinueButton"); // Finalize

      // Verify import success
      await authenticatedPage.click("#navEntitiesButtonDesktop");
      await expect(authenticatedPage.locator("text=(JSON)")).toBeVisible();
    },
  );
});
