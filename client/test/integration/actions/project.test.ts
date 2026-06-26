// Playwright imports
import test, { expect } from "@playwright/test";

// Test helper functions
import {
  navigateToSection,
  openItemFromTable,
  saveAndWait,
  clickButtonByText,
  createTestEntity,
  createTestProject,
  createTestUser,
  createTestWorkspace,
  switchWorkspace,
  addEntityToProject,
} from "../helpers";

test.describe("Project", () => {
  test.describe("Edit: Details", () => {
    test.beforeEach(async ({ context, page }) => {
      // Create User
      const user = await createTestUser(context);

      // Setup Workspace
      const workspace = await createTestWorkspace("Project-2", user);
      await createTestProject("1-Project-Name", user, workspace);
      await createTestProject("2-Project-Description", user, workspace);

      // Setup navigation
      await switchWorkspace(page, "Project-2");
      await page.goto("/");
    });

    test("should be able to rename the Project", async ({ page }) => {
      await navigateToSection(page, "Projects");
      await openItemFromTable(page, "1-Project-Name", "View Project");

      await page.click("#editProjectButton");
      await page.locator("#projectNameInput").fill("1-Project-Name (Updated)");
      await saveAndWait(page);

      await expect(page.locator("#projectNameTag")).toContainText("1-Project-Name (Updated)");

      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator("#projectNameTag")).toContainText("1-Project-Name (Updated)");
    });

    test("should be able to update the Project description", async ({ page }) => {
      await navigateToSection(page, "Projects");
      await openItemFromTable(page, "2-Project-Description", "View Project");

      const updatedDescription = "Updated Project description";

      await page.click("#editProjectButton");
      await page.locator("#projectDescriptionInput").fill(updatedDescription);
      await saveAndWait(page);

      await page.locator("text=Updated Successfully").waitFor({ state: "visible", timeout: 10000 });
      await page.waitForLoadState("networkidle");
      await page.locator(`text=${updatedDescription}`).waitFor({ state: "visible", timeout: 10000 });
    });
  });

  test.describe("Edit: Entities", () => {
    test.beforeEach(async ({ context, page }) => {
      // Create User
      const user = await createTestUser(context);

      // Setup Workspace
      const workspace = await createTestWorkspace("Project-3", user);
      await createTestProject("1-Project-Entity", user, workspace);
      await createTestEntity("1-Entity-Project", user, workspace);
      await createTestProject("2-Entity-Project", user, workspace);
      await createTestEntity("2-Project-Entity", user, workspace);

      // Setup navigation
      await switchWorkspace(page, "Project-3");
      await page.goto("/");
    });

    test("should be able to add and remove an Entity within a Project", async ({ page }) => {
      await navigateToSection(page, "Projects");
      await openItemFromTable(page, "1-Project-Entity", "View Project");
      await page.click("#editProjectButton");

      await addEntityToProject(page, "1-Entity-Project");

      // Check for the View button rather than the entity name since the table column truncates long names
      const table = page.getByTestId("data-table-scroll-container");
      await expect(table.locator('button[aria-label="View Entity"]')).toBeVisible({ timeout: 10000 });

      await page.reload();
      await expect(table.locator('button[aria-label="View Entity"]')).toBeVisible({ timeout: 10000 });

      await page.click("#editProjectButton");
      await table.locator('button[aria-label="Remove Entity"]').click();
      await saveAndWait(page);

      await page.reload();
      await expect(page.locator("text=No Entities")).toBeVisible({ timeout: 10000 });
    });

    test("should be able to remove a Project from an Entity via the Entity page", async ({ page }) => {
      await navigateToSection(page, "Projects");
      await openItemFromTable(page, "2-Entity-Project", "View Project");
      await page.click("#editProjectButton");
      await addEntityToProject(page, "2-Project-Entity");

      const table = page.getByTestId("data-table-scroll-container");
      await table.locator('button[aria-label="View Entity"]').first().click();

      await page.click("#editEntityButton");
      const projectsTable = page.getByTestId("data-table-scroll-container").filter({ hasText: "2-Entity-Project" });
      await projectsTable.locator('button[aria-label="Remove Project"]').first().click();
      await saveAndWait(page);

      await navigateToSection(page, "Projects");
      await openItemFromTable(page, "2-Entity-Project", "View Project");
      await page.click("#editProjectButton");
      await expect(page.locator("text=2-Project-Entity")).not.toBeVisible();
    });
  });

  test.describe("View", () => {
    test.beforeEach(async ({ context, page }) => {
      // Create User
      const user = await createTestUser(context);

      // Setup Workspace
      const workspace = await createTestWorkspace("Project-4", user);
      await createTestProject("1-Project-List", user, workspace);

      // Setup navigation
      await switchWorkspace(page, "Project-4");
      await page.goto("/");
    });

    test("should appear in the Projects list after creation", async ({ page }) => {
      await navigateToSection(page, "Projects");

      const table = page.getByTestId("data-table-scroll-container");
      await table.waitFor({ state: "visible", timeout: 5000 });
      await expect(table.locator("text=1-Project-List")).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Archive", () => {
    test.beforeEach(async ({ context, page }) => {
      // Create User
      const user = await createTestUser(context);

      // Setup Workspace
      const workspace = await createTestWorkspace("Project-5", user);
      await createTestProject("1-Project-Archive", user, workspace);

      // Setup navigation
      await switchWorkspace(page, "Project-5");
      await page.goto("/");
    });

    test("should archive and restore a Project", async ({ page }) => {
      await navigateToSection(page, "Projects");
      await openItemFromTable(page, "1-Project-Archive", "View Project");

      await page.click('button:has-text("Actions")');
      await page.locator('[data-value="archive"]').click();
      await clickButtonByText(page, "Confirm");
      await page
        .locator(".chakra-toast__root")
        .filter({ hasText: "Archived Successfully" })
        .waitFor({ state: "visible", timeout: 10000 });

      await page.locator('button:has-text("Restore")').waitFor({ state: "visible", timeout: 10000 });
      await page.click('button:has-text("Restore")');
      await page
        .locator(".chakra-toast__root")
        .filter({ hasText: "Restored Successfully" })
        .waitFor({ state: "visible", timeout: 10000 });

      await expect(page.locator("#editProjectButton")).toBeVisible({ timeout: 10000 });
    });
  });
});
