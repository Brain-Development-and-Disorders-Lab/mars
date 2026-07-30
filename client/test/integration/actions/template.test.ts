// Playwright imports
import { test, expect } from "@playwright/test";

// Test helper functions
import {
  navigateToSection,
  openItemFromTable,
  clickButtonByText,
  saveAndWait,
  createTestTemplate,
  createTestWorkspace,
  createTestUser,
  switchWorkspace,
} from "../helpers/global.helpers";

test.describe("Template", () => {
  test.describe("Edit", () => {
    test.beforeEach(async ({ context, page }) => {
      // Create User
      const user = await createTestUser(context);

      // Setup Workspace and Templates
      const workspace = await createTestWorkspace("Template-2", user);
      await createTestTemplate("1-Template-Edit", user, workspace);

      // Navigate for tests
      await page.goto("/");
      await switchWorkspace(page, "Template-2");
    });

    test("allows editing the Template name and description", async ({ page }) => {
      await navigateToSection(page, "Templates");
      await openItemFromTable(page, "1-Template-Edit", "View Template");

      await page.click("#editTemplateButton");
      await page.locator("#attributeNameInput").fill(`1-Template-Edit-Updated`);
      await page.locator("#attributeDescriptionInput").fill("Updated description");
      await saveAndWait(page);
      await expect(
        page.locator(".chakra-toast__root").filter({ hasText: "Updated Successfully" }).first(),
      ).toBeVisible();

      await page.reload();
      await expect(page.locator("#attributeNameInput")).toHaveValue(`1-Template-Edit-Updated`);
    });
  });

  test.describe("Export", () => {
    test.beforeEach(async ({ context, page }) => {
      // Create User
      const user = await createTestUser(context);

      // Setup Workspace and Templates
      const workspace = await createTestWorkspace("Template-3", user);
      await createTestTemplate("1-Template-Export", user, workspace);

      // Navigate for tests
      await page.goto("/");
      await switchWorkspace(page, "Template-3");
    });

    test("exports the Template as a JSON file", async ({ page }) => {
      await navigateToSection(page, "Templates");
      await openItemFromTable(page, "1-Template-Export", "View Template");

      await page.click('[data-testid="templateActionsButton"]');
      await page.click('[data-value="export"]');
      await page.locator('button:has-text("Download")').waitFor({ state: "visible", timeout: 10000 });
      const downloadPromise = page.waitForEvent("download");
      await page.locator('button:has-text("Download")').click();
      await downloadPromise;
    });
  });

  test.describe("Archive", () => {
    test.beforeEach(async ({ context, page }) => {
      // Create User
      const user = await createTestUser(context);

      // Setup Workspace and Templates
      const workspace = await createTestWorkspace("Template-4", user);
      await createTestTemplate("1-Template-Archive", user, workspace);

      // Navigate for tests
      await page.goto("/");
      await switchWorkspace(page, "Template-4");
    });

    test("archives and restores a Template", async ({ page }) => {
      await navigateToSection(page, "Templates");
      await openItemFromTable(page, "1-Template-Archive", "View Template");

      await page.click('[data-testid="templateActionsButton"]');
      await page.click('[data-value="archive"]');
      await clickButtonByText(page, "Confirm");
      await expect(page.locator(".chakra-toast__root").filter({ hasText: "Archived Successfully" })).toBeVisible();

      await page.click("#restoreTemplateButton");
      await expect(
        page.locator(".chakra-toast__root").filter({ hasText: "Restored Template successfully" }),
      ).toBeVisible();

      await expect(page.locator("#editTemplateButton")).toBeVisible({ timeout: 10000 });
    });
  });
});
