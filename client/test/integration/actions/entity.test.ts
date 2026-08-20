// Playwright imports
import { test, expect } from "@playwright/test";

// Test helper functions
import {
  navigateToSection,
  openItemFromTable,
  saveAndWait,
  clickButtonByText,
  createTestEntity,
  createTestUser,
  createTestWorkspace,
  switchWorkspace,
} from "../helpers/global.helpers";

test.describe("Entity", () => {
  test.describe("Edit", () => {
    test.beforeEach(async ({ context, page }) => {
      // Create User
      const user = await createTestUser(context);

      // Setup Workspace
      const workspace = await createTestWorkspace("Entity-2", user);
      await createTestEntity("1-Entity-Details", user, workspace);
      await createTestEntity("2-Entity-Description", user, workspace);

      // Setup navigation
      await page.goto("/");
      await switchWorkspace(page, "Entity-2");
    });

    test("should be able to rename the Entity", async ({ page }) => {
      await navigateToSection(page, "Entities");
      await openItemFromTable(page, "1-Entity-Details", "View Entity");

      await page.click("#editEntityButton");
      await page.locator("#entityNameInput").fill("1-Entity-Details (Updated)");
      await saveAndWait(page);

      await expect(page.locator("#entityNameTag")).toContainText("1-Entity-Details (Upd...");
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator("#entityNameTag")).toContainText("1-Entity-Details (Upd...");
    });

    test("should be able to update the Entity description", async ({ page }) => {
      await navigateToSection(page, "Entities");
      await openItemFromTable(page, "2-Entity-Description", "View Entity");

      const updatedDescription = "Updated Entity description";

      await page.click("#editEntityButton");
      await page.locator("#entityDescriptionInput").fill(updatedDescription);
      await saveAndWait(page);

      await page.locator("text=Updated Successfully").waitFor({ state: "visible", timeout: 10000 });
      await page.waitForLoadState("networkidle");
      await page.locator(`text=${updatedDescription}`).waitFor({ state: "visible", timeout: 10000 });
    });
  });

  test.describe("View", () => {
    test.beforeEach(async ({ context, page }) => {
      // Create User
      const user = await createTestUser(context);

      // Setup Workspace
      const workspace = await createTestWorkspace("Entity-3", user);
      await createTestEntity("1-Entity-List", user, workspace);

      // Setup navigation
      await page.goto("/");
      await switchWorkspace(page, "Entity-3");
    });

    test("should appear in the Entities list after creation", async ({ page }) => {
      await navigateToSection(page, "Entities");

      const table = page.getByTestId("data-table-scroll-container");
      await table.waitFor({ state: "visible", timeout: 5000 });
      await expect(table.locator(`text=1-Entity-List`)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Archive", () => {
    test.beforeEach(async ({ context, page }) => {
      // Create User
      const user = await createTestUser(context);

      // Setup Workspace
      const workspace = await createTestWorkspace("Entity-4", user);
      await createTestEntity("1-Entity-Archive", user, workspace);

      // Setup navigation
      await page.goto("/");
      await switchWorkspace(page, "Entity-4");
    });

    test("should archive and restore an Entity", async ({ page }) => {
      await navigateToSection(page, "Entities");
      await openItemFromTable(page, "1-Entity-Archive", "View Entity");

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
