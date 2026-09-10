// Playwright imports
import { test, expect } from "@playwright/test";

// Test helper functions
import {
  navigateToSection,
  openItemFromTable,
  clickButtonByText,
  saveAndWait,
  createTestAttribute,
  createTestWorkspace,
  createTestUser,
  switchWorkspace,
} from "../helpers/global.helpers";

test.describe("Attribute", () => {
  test.describe("Edit", () => {
    test.beforeEach(async ({ context, page }) => {
      // Create User
      const user = await createTestUser(context);

      // Setup Workspace and Attributes
      const workspace = await createTestWorkspace("Attribute-2", user);
      await createTestAttribute("1-Attribute-Edit", user, workspace);

      // Navigate for tests
      await page.goto("/");
      await switchWorkspace(page, "Attribute-2");
    });

    test("allows editing the Attribute name and description", async ({ page }) => {
      await navigateToSection(page, "Attributes");
      await openItemFromTable(page, "1-Attribute-Edit", "View Attribute");

      await page.click("#editAttributeButton");
      await page.locator("#attributeNameInput").fill(`1-Attribute-Edit-Updated`);
      await page.locator("#attributeDescriptionInput").fill("Updated description");
      await saveAndWait(page);
      await expect(
        page.locator(".chakra-toast__root").filter({ hasText: "Updated Successfully" }).first(),
      ).toBeVisible();

      await page.reload();
      await expect(page.locator("#attributeNameInput")).toHaveValue(`1-Attribute-Edit-Updated`);
    });
  });

  test.describe("Export", () => {
    test.beforeEach(async ({ context, page }) => {
      // Create User
      const user = await createTestUser(context);

      // Setup Workspace and Attributes
      const workspace = await createTestWorkspace("Attribute-3", user);
      await createTestAttribute("1-Attribute-Export", user, workspace);

      // Navigate for tests
      await page.goto("/");
      await switchWorkspace(page, "Attribute-3");
    });

    test("exports the Attribute as a JSON file", async ({ page }) => {
      await navigateToSection(page, "Attributes");
      await openItemFromTable(page, "1-Attribute-Export", "View Attribute");

      await page.click('[data-testid="attributeActionsButton"]');
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

      // Setup Workspace and Attributes
      const workspace = await createTestWorkspace("Attribute-4", user);
      await createTestAttribute("1-Attribute-Archive", user, workspace);

      // Navigate for tests
      await page.goto("/");
      await switchWorkspace(page, "Attribute-4");
    });

    test("archives and restores an Attribute", async ({ page }) => {
      await navigateToSection(page, "Attributes");
      await openItemFromTable(page, "1-Attribute-Archive", "View Attribute");

      await page.click('[data-testid="attributeActionsButton"]');
      await page.click('[data-value="archive"]');
      await clickButtonByText(page, "Confirm");
      await expect(page.locator(".chakra-toast__root").filter({ hasText: "Archived Successfully" })).toBeVisible();

      await page.click("#restoreAttributeButton");
      await expect(
        page.locator(".chakra-toast__root").filter({ hasText: "Restored Attribute successfully" }),
      ).toBeVisible();

      await expect(page.locator("#editAttributeButton")).toBeVisible({ timeout: 10000 });
    });
  });
});
