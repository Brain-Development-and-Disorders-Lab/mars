// Playwright imports
import { test, expect } from "@playwright/test";

// Test helper functions
import {
  navigateToSection,
  openItemFromTable,
  fillMDEditor,
  saveAndWait,
  clickButtonByText,
  getUniqueName,
  performLogin,
  setupEnvironment,
  createTestEntity,
} from "../helpers";

test.describe("Entity", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await performLogin(page);
    await setupEnvironment(page, "entity");
    await page.goto("/");
  });

  test.describe("Create", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/create/entity");
      await expect(page.locator("h2:has-text('Create Entity')")).toBeVisible();
    });

    test("should navigate through the steps", async ({ page }) => {
      const entityName = getUniqueName("Test Entity Navigation");

      await page.locator("[data-testid='create-entity-name']").fill(entityName);
      await page.locator('input[type="date"]').fill("2023-10-01");
      await page
        .locator("[data-testid='create-entity-description'] textarea")
        .fill("This is a test entity for navigation.");

      await page.click("[data-testid='create-entity-continue']");
      await expect(page.locator("text=No Relationships")).toBeVisible();

      // Back navigation must restore the form state
      await page.click("[data-testid='create-entity-back']");
      await expect(page.locator("h2:has-text('Create Entity')")).toBeVisible();
      await expect(page.locator("[data-testid='create-entity-name']")).toHaveValue(entityName);

      await page.click("[data-testid='create-entity-continue']");
      await expect(page.locator("text=No Relationships")).toBeVisible();

      await page.click("[data-testid='create-entity-continue']");
      await expect(page.locator("text=No Attributes")).toBeVisible();

      await page.click("[data-testid='create-entity-back']");
      await expect(page.locator("text=No Relationships")).toBeVisible();
    });

    test("should complete Entity creation", async ({ page }) => {
      const entityName = getUniqueName("Test Entity Complete");

      await page.locator("[data-testid='create-entity-name']").fill(entityName);
      await page.locator('input[type="date"]').fill("2023-10-01");
      await page
        .locator("[data-testid='create-entity-description'] textarea")
        .fill("This is a test entity for completion.");
      await page.click("[data-testid='create-entity-continue']");
      await page.click("[data-testid='create-entity-continue']");
      await page.click("[data-testid='create-entity-finish']");

      await expect(page).toHaveURL(/\/entities/);
    });
  });

  test.describe("Edit details", () => {
    test("should be able to rename the Entity", async ({ page }) => {
      const entityName = getUniqueName("Test Entity");
      await createTestEntity(page, entityName);
      await navigateToSection(page, "Entities");
      await openItemFromTable(page, entityName, "View Entity");

      await page.click("#editEntityButton");
      await page.locator("#entityNameInput").fill(`${entityName} (Updated)`);
      await saveAndWait(page);

      await expect(page.locator("#entityNameTag")).toContainText(`${entityName} (Updated)`);

      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator("#entityNameTag")).toContainText(`${entityName} (Updated)`);
    });

    test("should be able to update the Entity description", async ({ page }) => {
      const entityName = getUniqueName("Test Entity");
      await createTestEntity(page, entityName);
      await navigateToSection(page, "Entities");
      await openItemFromTable(page, entityName, "View Entity");

      const updatedDescription = "Updated Entity description";

      await page.click("#editEntityButton");
      await fillMDEditor(page, "#entityDescriptionInput", updatedDescription);
      await saveAndWait(page);

      await page.locator("text=Updated Successfully").waitFor({ state: "visible", timeout: 10000 });
      await page.waitForLoadState("networkidle");
      await page.locator(`text=${updatedDescription}`).waitFor({ state: "visible", timeout: 10000 });
    });
  });

  test.describe("List visibility", () => {
    test("should appear in the Entities list after creation", async ({ page }) => {
      const entityName = getUniqueName("Listed Entity");
      await createTestEntity(page, entityName);
      await navigateToSection(page, "Entities");

      const table = page.locator(".data-table-scroll-container");
      await table.waitFor({ state: "visible", timeout: 5000 });
      await expect(table.locator(`text=${entityName}`)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Archive", () => {
    test("should archive and restore an Entity", async ({ page }) => {
      const entityName = getUniqueName("Archive Entity");
      await createTestEntity(page, entityName);
      await navigateToSection(page, "Entities");
      await openItemFromTable(page, entityName, "View Entity");

      await page.click('button:has-text("Actions")');
      await page.locator("#archiveEntityButton").click();
      await clickButtonByText(page, "Confirm");
      await page
        .locator(".chakra-toast__root")
        .filter({ hasText: "Archived Successfully" })
        .waitFor({ state: "visible", timeout: 10000 });

      await page.locator("#restoreEntityButton").waitFor({ state: "visible", timeout: 10000 });
      await page.click("#restoreEntityButton");
      await page
        .locator(".chakra-toast__root")
        .filter({ hasText: "Entity successfully unarchived" })
        .waitFor({ state: "visible", timeout: 10000 });

      await expect(page.locator("#editEntityButton")).toBeVisible({ timeout: 10000 });
    });
  });
});
