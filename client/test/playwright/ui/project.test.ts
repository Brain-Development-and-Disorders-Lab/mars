// Playwright imports
import test, { expect, Page } from "@playwright/test";

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

async function createTestProject(page: Page, projectName: string): Promise<void> {
  await page.goto("/create/project");
  await page.locator("[data-testid='create-project-name']").waitFor({ state: "visible", timeout: 10000 });
  await page.locator("[data-testid='create-project-name']").fill(projectName);
  await page.locator('input[type="datetime-local"]').fill("2023-10-01T12:00");
  await page
    .locator("[data-testid='create-project-description'] textarea")
    .fill("Test project for entity editing tests");
  await page.click("[data-testid='create-project-finish']");
  await page.waitForURL(/\/projects/, { timeout: 10000 });
  await page.waitForTimeout(1000);
}

test.describe("Project", () => {
  test.describe("Create", () => {
    test.beforeEach(async ({ page }) => {
      test.setTimeout(60000);
      await performLogin(page);
      await setupEnvironment(page, "project");
      await page.goto("/create/project");
      await expect(page.locator("h2:has-text('Create Project')")).toBeVisible();
    });

    test("should create a project with required fields", async ({ page }) => {
      const projectName = getUniqueName("Project Complete");

      await page.locator("[data-testid='create-project-name']").fill(projectName);
      await page.locator('input[type="datetime-local"]').fill("2023-10-01T12:00");
      await page
        .locator("[data-testid='create-project-description'] textarea")
        .fill("This is a test project description.");
      await page.click("[data-testid='create-project-finish']");

      await expect(page).toHaveURL(/\/projects/);
    });

    test("should validate required fields", async ({ page }) => {
      await expect(page.locator("[data-testid='create-project-finish']")).toBeDisabled();

      await page.locator("[data-testid='create-project-name']").fill(getUniqueName("Project Name"));
      await expect(page.locator("[data-testid='create-project-finish']")).toBeDisabled();

      await page.locator("[data-testid='create-project-description'] textarea").fill("Test description");
      await page.locator('input[type="datetime-local"]').fill("2023-10-01T12:00");
      await expect(page.locator("[data-testid='create-project-finish']")).toBeEnabled();
    });

    test("should handle cancel button", async ({ page }) => {
      await page.locator("[data-testid='create-project-name']").fill(getUniqueName("Project Cancel"));
      await page.click("[data-testid='create-project-cancel']");

      // A blocker modal may appear when navigating away with unsaved changes
      const continueButton = page.locator('button:has-text("Continue")');
      if ((await continueButton.count()) > 0) {
        await continueButton.click();
      }

      await expect(page).toHaveURL(/\/projects/);
    });
  });

  test.describe("Edit details", () => {
    test.beforeEach(async ({ page }) => {
      test.setTimeout(60000);
      await performLogin(page);
    });

    test("should be able to rename the Project", async ({ page }) => {
      const projectName = getUniqueName("Test Project");
      await createTestProject(page, projectName);
      await navigateToSection(page, "Projects");
      await openItemFromTable(page, projectName, "View Project");

      await page.click("#editProjectButton");
      await page.locator("#projectNameInput").fill(`${projectName} (Updated)`);
      await saveAndWait(page);

      await expect(page.locator("#projectNameTag")).toContainText(`${projectName} (Updated)`);

      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator("#projectNameTag")).toContainText(`${projectName} (Updated)`);
    });

    test("should be able to update the Project description", async ({ page }) => {
      const projectName = getUniqueName("Test Project");
      await createTestProject(page, projectName);
      await navigateToSection(page, "Projects");
      await openItemFromTable(page, projectName, "View Project");

      const updatedDescription = "Updated Project description";

      await page.click("#editProjectButton");
      await fillMDEditor(page, "#projectDescriptionInput", updatedDescription);
      await saveAndWait(page);

      await page.locator("text=Updated Successfully").waitFor({ state: "visible", timeout: 10000 });
      await page.waitForLoadState("networkidle");
      await page.locator(`text=${updatedDescription}`).waitFor({ state: "visible", timeout: 10000 });
    });
  });

  test.describe("Edit entities", () => {
    test.beforeEach(async ({ page }) => {
      test.setTimeout(60000);
      await performLogin(page);
      await setupEnvironment(page, "project-edit-entities");
      await page.goto("/");
    });

    async function addEntityToProject(page: Page, entityName: string): Promise<void> {
      await page.click("#addEntityButton");
      // Fill the input directly to trigger the debounced search query rather than clicking the outer container
      await page.locator("#entitySearchSelect input").fill(entityName);
      // Results load after a 300ms debounce plus network round-trip
      await page.locator(".search-select-results button").first().waitFor({ state: "visible", timeout: 10000 });
      await page.locator(".search-select-results").locator(`button:has-text("${entityName}")`).first().click();
      // The Done button enables once an entity is staged
      await page.locator("#addEntityDoneButton:not([disabled])").waitFor({ state: "visible", timeout: 5000 });
      await page.click("#addEntityDoneButton");
      await saveAndWait(page);
    }

    test("should be able to add and remove an Entity within a Project", async ({ page }) => {
      const entityName = getUniqueName("Project Test Entity");
      const projectName = getUniqueName("Project - Add and Remove Entity");

      await createTestEntity(page, entityName);
      await createTestProject(page, projectName);
      await navigateToSection(page, "Projects");
      await openItemFromTable(page, projectName, "View Project");
      await page.click("#editProjectButton");

      await addEntityToProject(page, entityName);

      // Check for the View button rather than the entity name since the table column truncates long names
      const table = page.locator(".data-table-scroll-container");
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
      const entityName = getUniqueName("Project Test Entity");
      const projectName = getUniqueName("Project - Remove Project via Entity");

      await createTestEntity(page, entityName);
      await createTestProject(page, projectName);
      await navigateToSection(page, "Projects");
      await openItemFromTable(page, projectName, "View Project");
      await page.click("#editProjectButton");
      await addEntityToProject(page, entityName);

      const table = page.locator(".data-table-scroll-container");
      await table.locator('button[aria-label="View Entity"]').first().click();

      await page.click("#editEntityButton");
      const projectsTable = page.locator(".data-table-scroll-container").filter({ hasText: projectName });
      await projectsTable.locator('button[aria-label="Remove Project"]').first().click();
      await saveAndWait(page);

      await navigateToSection(page, "Projects");
      await openItemFromTable(page, projectName, "View Project");
      await page.click("#editProjectButton");
      await expect(page.locator(`text=${entityName}`)).not.toBeVisible();
    });
  });

  test.describe("List visibility", () => {
    test.beforeEach(async ({ page }) => {
      test.setTimeout(60000);
      await performLogin(page);
      await setupEnvironment(page, "project-list");
      await page.goto("/");
    });

    test("should appear in the Projects list after creation", async ({ page }) => {
      const projectName = getUniqueName("Listed Project");
      await createTestProject(page, projectName);
      await navigateToSection(page, "Projects");

      const table = page.locator(".data-table-scroll-container");
      await table.waitFor({ state: "visible", timeout: 5000 });
      await expect(table.locator(`text=${projectName}`)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Archive", () => {
    test.beforeEach(async ({ page }) => {
      test.setTimeout(60000);
      await performLogin(page);
      await setupEnvironment(page, "project-archive");
      await page.goto("/");
    });

    test("should archive and restore a Project", async ({ page }) => {
      const projectName = getUniqueName("Archive Project");
      await createTestProject(page, projectName);
      await navigateToSection(page, "Projects");
      await openItemFromTable(page, projectName, "View Project");

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
