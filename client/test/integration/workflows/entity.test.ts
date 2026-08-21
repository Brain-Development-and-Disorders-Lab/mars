// Playwright imports
import { test, expect } from "@playwright/test";

// Test helper functions
import { getUniqueName, createTestUser, createTestWorkspace, switchWorkspace } from "../helpers/global.helpers";

test.describe("Entity", () => {
  test.describe("Create", () => {
    test.beforeEach(async ({ context, page }) => {
      // Create User
      const user = await createTestUser(context);

      // Setup Workspace
      await createTestWorkspace("Entity-1", user);

      // Setup navigation
      await switchWorkspace(page, "Entity-1");
      await page.goto("/create/entity");
      await expect(page.locator("h2:has-text('Create Entity')")).toBeVisible();
    });

    test("should navigate through the steps", async ({ page }) => {
      const entityName = getUniqueName("Test Entity Navigation");

      await page.locator("[data-testid='create-entity-name']").fill(entityName);
      await page.locator('input[type="date"]').fill("2023-10-01T12:00");
      await page.locator("[data-testid='create-entity-description']").fill("This is a test entity for navigation.");

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
      await page.locator('input[type="date"]').fill("2023-10-01T12:00");
      await page.locator("[data-testid='create-entity-description']").fill("This is a test entity for completion.");
      await page.click("[data-testid='create-entity-continue']");
      await page.click("[data-testid='create-entity-continue']");
      await page.click("[data-testid='create-entity-finish']");

      await expect(page).toHaveURL(/\/entities/);
    });
  });
});
