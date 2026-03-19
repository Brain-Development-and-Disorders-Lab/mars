// Playwright imports
import test, { expect, Page } from "@playwright/test";

// Test helper functions
import {
  navigateToSection,
  openItemFromTable,
  fillMDEditor,
  saveAndWait,
  getUniqueName,
  performLogin,
  setupEnvironment,
} from "../helpers";

async function createTestProject(
  page: Page,
  projectName: string,
): Promise<void> {
  await page.goto("/create/project");
  await page
    .locator("[data-testid='create-project-name']")
    .waitFor({ state: "visible", timeout: 10000 });
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
      // Ensure the user is logged in
      await performLogin(page);

      // Perform setup of the test environment
      await setupEnvironment(page, "project");

      // Navigate to the base page
      await page.goto("/create/project");
      await expect(page.locator("h2:has-text('Create Project')")).toBeVisible();
    });

    test("should display the initial page with required fields", async ({
      page,
    }) => {
      await expect(page.locator("h2:has-text('Create Project')")).toBeVisible();
      await expect(
        page.locator("[data-testid='create-project-name']"),
      ).toBeVisible();
      await expect(page.locator('input[type="datetime-local"]')).toBeVisible();
      await expect(
        page.locator("[data-testid='create-project-description'] textarea"),
      ).toBeVisible();
    });

    test("should create a project with required fields", async ({ page }) => {
      // Use unique name to avoid conflicts (short suffix to avoid truncation)
      const shortId = Math.random().toString(36).substring(2, 6); // 4 char random string
      const projectName = `Project Complete ${shortId}`;

      // Fill in details
      await page
        .locator("[data-testid='create-project-name']")
        .fill(projectName);
      await page
        .locator('input[type="datetime-local"]')
        .fill("2023-10-01T12:00");
      await page
        .locator("[data-testid='create-project-description'] textarea")
        .fill("This is a test project description.");

      // Submit
      await page.click("[data-testid='create-project-finish']");

      // Verify navigation
      await expect(page).toHaveURL(/\/projects/);
    });

    test("should validate required fields", async ({ page }) => {
      // Finish button should be disabled when empty
      await expect(
        page.locator("[data-testid='create-project-finish']"),
      ).toBeDisabled();

      // Fill name only (short suffix to avoid truncation)
      const shortId = Math.random().toString(36).substring(2, 6); // 4 char random string
      const projectName = `Project Name ${shortId}`;
      await page
        .locator("[data-testid='create-project-name']")
        .fill(projectName);
      await expect(
        page.locator("[data-testid='create-project-finish']"),
      ).toBeDisabled();

      // Fill description
      await page
        .locator("[data-testid='create-project-description'] textarea")
        .fill("Test description");
      await page
        .locator('input[type="datetime-local"]')
        .fill("2023-10-01T12:00");

      // Finish button should now be enabled
      await expect(
        page.locator("[data-testid='create-project-finish']"),
      ).toBeEnabled();
    });

    test("should handle cancel button", async ({ page }) => {
      // Short suffix to avoid truncation
      const shortId = Math.random().toString(36).substring(2, 6); // 4 char random string
      const projectName = `Project Cancel ${shortId}`;

      await page
        .locator("[data-testid='create-project-name']")
        .fill(projectName);

      await page.click("[data-testid='create-project-cancel']");

      // Handle blocker modal if it appears
      const continueButton = page.locator('button:has-text("Continue")');
      if ((await continueButton.count()) > 0) {
        await continueButton.click();
      }

      // Should navigate away
      await expect(page).toHaveURL(/\/projects/);
    });
  });

  test.describe("Edit details", () => {
    test.beforeEach(async ({ page }) => {
      // Ensure the user is logged in
      await performLogin(page);
    });

    test("should be able to rename the Project", async ({ page }) => {
      const projectName = getUniqueName("Example Project");
      await createTestProject(page, projectName);
      await navigateToSection(page, "Projects");
      await openItemFromTable(page, projectName, "View Project");

      await page.click("#editProjectButton");
      await page.locator("#projectNameInput").fill(`${projectName} (Updated)`);
      await saveAndWait(page);

      await expect(page.locator("#projectNameTag")).toContainText(
        `${projectName} (Updated)`,
      );

      // Verify persistence after reload
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator("#projectNameTag")).toContainText(
        `${projectName} (Updated)`,
      );
    });

    test("should be able to update the Project description", async ({
      page,
    }) => {
      const projectName = getUniqueName("Example Project");
      await createTestProject(page, projectName);
      await navigateToSection(page, "Projects");
      await openItemFromTable(page, projectName, "View Project");

      const updatedDescription = "Updated Project description";

      // Enter edit mode and update description
      await page.click("#editProjectButton");
      await fillMDEditor(page, "#projectDescriptionInput", updatedDescription);

      // Save and wait for completion
      await saveAndWait(page);

      // Verify success toast appears (confirms mutation completed)
      await page
        .locator("text=Updated Successfully")
        .waitFor({ state: "visible", timeout: 10000 });

      // Wait for refetch to complete
      await page.waitForLoadState("networkidle");

      // Verify the description appears in view mode
      await page
        .locator(`text=${updatedDescription}`)
        .waitFor({ state: "visible", timeout: 10000 });
    });
  });

  test.describe("Edit entities", () => {
    test.beforeEach(async ({ page }) => {
      // Ensure the user is logged in
      await performLogin(page);
    });

    async function addEntityToProject(
      page: Page,
      entityName: string,
    ): Promise<void> {
      await page.click("#addEntityButton");
      await page.click("#entitySearchSelect");
      await page
        .getByRole("button", { name: entityName, exact: true })
        .first()
        .click();
      await page.click("#addEntityDoneButton");
      await saveAndWait(page);
    }

    test("should be able to add and remove an Entity within a Project", async ({
      page,
    }) => {
      const projectName = getUniqueName("Project - Add and Remove Entity");
      const entityName = "Example Entity";

      await createTestProject(page, projectName);
      await navigateToSection(page, "Projects");
      await openItemFromTable(page, projectName, "View Project");
      await page.click("#editProjectButton");

      await addEntityToProject(page, entityName);

      // Verify entity added
      const table = page.locator(".data-table-scroll-container");
      await expect(table.locator(`text=${entityName}`)).toBeVisible({
        timeout: 10000,
      });

      // Verify persistence after reload
      await page.reload();
      await expect(table.locator(`text=${entityName}`)).toBeVisible({
        timeout: 10000,
      });

      // Remove the entity
      await page.click("#editProjectButton");
      const entityRow = table
        .locator(`text=${entityName}`)
        .locator("..")
        .locator("..")
        .first();
      await entityRow.locator('button[aria-label="Remove Entity"]').click();
      await saveAndWait(page);

      // Verify entity removed
      await page.reload();
      await page.click("#editProjectButton");
      await expect(page.locator(`text=${entityName}`)).not.toBeVisible();
    });

    test("should be able to remove a Project from an Entity via the Entity page", async ({
      page,
    }) => {
      const projectName = getUniqueName("Project - Remove Project via Entity");
      const entityName = "Example Entity";

      await createTestProject(page, projectName);
      await navigateToSection(page, "Projects");
      await openItemFromTable(page, projectName, "View Project");
      await page.click("#editProjectButton");
      await addEntityToProject(page, entityName);

      // Navigate to entity page
      const table = page.locator(".data-table-scroll-container");
      const entityRow = table
        .locator(`text=${entityName}`)
        .locator("..")
        .locator("..")
        .first();
      await entityRow
        .locator('button[aria-label="View Entity"]')
        .first()
        .click();

      // Remove project from entity
      await page.click("#editEntityButton");
      const projectsTable = page
        .locator(".data-table-scroll-container")
        .filter({ hasText: projectName });
      const projectRow = projectsTable
        .locator(`text=${projectName}`)
        .locator("..")
        .locator("..")
        .first();
      await projectRow
        .locator('button[aria-label="Remove Project"]')
        .first()
        .click();
      await saveAndWait(page);

      // Verify project no longer contains entity
      await navigateToSection(page, "Projects");
      await openItemFromTable(page, projectName, "View Project");
      await page.click("#editProjectButton");
      await expect(page.locator(`text=${entityName}`)).not.toBeVisible();
    });
  });
});
