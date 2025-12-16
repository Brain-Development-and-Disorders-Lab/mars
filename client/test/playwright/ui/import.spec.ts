import { test, expect } from "../fixtures";
import { waitForButtonEnabled, selectDropdownOption } from "../helpers";
import * as path from "path";

test.describe("Import", () => {
  test("should import a CSV file successfully", async ({
    authenticatedPage,
  }) => {
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

    await waitForButtonEnabled(authenticatedPage, "#importContinueButton");
    await authenticatedPage.click("#importContinueButton");

    // Wait for details page to load before selecting columns
    await authenticatedPage.waitForLoadState("networkidle");

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
  });

  test("should import a JSON file successfully", async ({
    authenticatedPage,
  }) => {
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

    // Wait for continue button to be enabled
    await waitForButtonEnabled(authenticatedPage, "#importContinueButton");
    await authenticatedPage.click("#importContinueButton");
    await authenticatedPage
      .locator('input[placeholder="Defined in JSON"]')
      .first()
      .waitFor({ state: "visible", timeout: 15000 });
    await authenticatedPage.waitForLoadState("networkidle");

    const continueButton = authenticatedPage.locator("#importContinueButton");
    await continueButton.waitFor({ state: "visible", timeout: 10000 });
    await waitForButtonEnabled(authenticatedPage, "#importContinueButton");
    await continueButton.click();

    await authenticatedPage
      .locator("text=Existing attributes defined in JSON will be preserved")
      .waitFor({ state: "visible", timeout: 10000 });
    await authenticatedPage.waitForLoadState("networkidle");

    await continueButton.waitFor({ state: "visible", timeout: 10000 });
    await waitForButtonEnabled(authenticatedPage, "#importContinueButton");
    await continueButton.click();

    await authenticatedPage
      .locator('button:has-text("Finish")')
      .waitFor({ state: "visible", timeout: 15000 });
    await authenticatedPage.waitForLoadState("networkidle");

    await continueButton.waitFor({ state: "visible", timeout: 10000 });
    await waitForButtonEnabled(authenticatedPage, "#importContinueButton");
    await continueButton.click();

    // Verify import success
    await authenticatedPage.click("#navEntitiesButtonDesktop");
    await expect(authenticatedPage.locator("text=(JSON)")).toBeVisible();
  });
});
