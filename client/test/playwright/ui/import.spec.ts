import { test, expect } from "../fixtures";
import { selectDropdownOption, clickButtonWhenEnabled } from "../helpers";
import * as path from "path";

test.describe("Import", () => {
  test("should import a CSV file successfully", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/");
    await clickButtonWhenEnabled(authenticatedPage, "#navImportButtonDesktop");

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

    await clickButtonWhenEnabled(authenticatedPage, "#importContinueButton");

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
    await clickButtonWhenEnabled(authenticatedPage, "#importContinueButton"); // Attributes page
    await clickButtonWhenEnabled(authenticatedPage, "#importContinueButton"); // Review page
    await clickButtonWhenEnabled(authenticatedPage, "#importContinueButton"); // Finalize

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
    await clickButtonWhenEnabled(authenticatedPage, "#navImportButtonDesktop");

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
    await clickButtonWhenEnabled(authenticatedPage, "#importContinueButton");
    await authenticatedPage
      .locator('input[placeholder="Defined in JSON"]')
      .first()
      .waitFor({ state: "visible", timeout: 15000 });
    await authenticatedPage.waitForLoadState("networkidle");

    await clickButtonWhenEnabled(authenticatedPage, "#importContinueButton");

    await authenticatedPage
      .locator("text=Existing attributes defined in JSON will be preserved")
      .waitFor({ state: "visible", timeout: 10000 });
    await authenticatedPage.waitForLoadState("networkidle");

    await clickButtonWhenEnabled(authenticatedPage, "#importContinueButton");

    await authenticatedPage
      .locator('button:has-text("Finish")')
      .waitFor({ state: "visible", timeout: 15000 });
    await authenticatedPage.waitForLoadState("networkidle");

    await clickButtonWhenEnabled(authenticatedPage, "#importContinueButton");

    // Verify import success
    await authenticatedPage.click("#navEntitiesButtonDesktop");
    await expect(authenticatedPage.locator("text=(JSON)")).toBeVisible();
  });
});
