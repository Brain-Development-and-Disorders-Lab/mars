import { testWithWorkspace, expect } from "../fixtures";
import {
  navigateToSection,
  openItemFromTable,
  fillMDEditor,
  saveAndWait,
  getUniqueName,
} from "../helpers";
import { Page } from "@playwright/test";

testWithWorkspace.describe("Project", () => {
  testWithWorkspace.describe("Create", () => {
    testWithWorkspace.beforeEach(async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/create/project");
      await expect(
        authenticatedPage.locator("h2:has-text('Create Project')"),
      ).toBeVisible();
    });

    testWithWorkspace(
      "should display the initial page with required fields",
      async ({ authenticatedPage }) => {
        await expect(
          authenticatedPage.locator("h2:has-text('Create Project')"),
        ).toBeVisible();
        await expect(
          authenticatedPage.locator("[data-testid='create-project-name']"),
        ).toBeVisible();
        await expect(
          authenticatedPage.locator('input[type="datetime-local"]'),
        ).toBeVisible();
        await expect(
          authenticatedPage.locator(
            "[data-testid='create-project-description'] textarea",
          ),
        ).toBeVisible();
      },
    );

    testWithWorkspace(
      "should create a project with required fields",
      async ({ authenticatedPage }) => {
        // Use unique name to avoid conflicts (short suffix to avoid truncation)
        const shortId = Math.random().toString(36).substring(2, 6); // 4 char random string
        const projectName = `Project Complete ${shortId}`;

        // Fill in details
        await authenticatedPage
          .locator("[data-testid='create-project-name']")
          .fill(projectName);
        await authenticatedPage
          .locator('input[type="datetime-local"]')
          .fill("2023-10-01T12:00");
        await authenticatedPage
          .locator("[data-testid='create-project-description'] textarea")
          .fill("This is a test project description.");

        // Submit
        await authenticatedPage.click("[data-testid='create-project-finish']");

        // Verify navigation
        await expect(authenticatedPage).toHaveURL(/\/projects/);
      },
    );

    testWithWorkspace(
      "should validate required fields",
      async ({ authenticatedPage }) => {
        // Finish button should be disabled when empty
        await expect(
          authenticatedPage.locator("[data-testid='create-project-finish']"),
        ).toBeDisabled();

        // Fill name only (short suffix to avoid truncation)
        const shortId = Math.random().toString(36).substring(2, 6); // 4 char random string
        const projectName = `Project Name ${shortId}`;
        await authenticatedPage
          .locator("[data-testid='create-project-name']")
          .fill(projectName);
        await expect(
          authenticatedPage.locator("[data-testid='create-project-finish']"),
        ).toBeDisabled();

        // Fill description
        await authenticatedPage
          .locator("[data-testid='create-project-description'] textarea")
          .fill("Test description");
        await authenticatedPage
          .locator('input[type="datetime-local"]')
          .fill("2023-10-01T12:00");

        // Finish button should now be enabled
        await expect(
          authenticatedPage.locator("[data-testid='create-project-finish']"),
        ).toBeEnabled();
      },
    );

    testWithWorkspace(
      "should handle cancel button",
      async ({ authenticatedPage }) => {
        // Short suffix to avoid truncation
        const shortId = Math.random().toString(36).substring(2, 6); // 4 char random string
        const projectName = `Project Cancel ${shortId}`;

        await authenticatedPage
          .locator("[data-testid='create-project-name']")
          .fill(projectName);

        await authenticatedPage.click("[data-testid='create-project-cancel']");

        // Handle blocker modal if it appears
        const continueButton = authenticatedPage.locator(
          'button:has-text("Continue")',
        );
        if ((await continueButton.count()) > 0) {
          await continueButton.click();
        }

        // Should navigate away
        await expect(authenticatedPage).toHaveURL(/\/projects/);
      },
    );
  });

  testWithWorkspace.describe("Edit details", () => {
    testWithWorkspace(
      "should be able to rename the Project",
      async ({ authenticatedPage }) => {
        await navigateToSection(authenticatedPage, "Projects");
        await openItemFromTable(
          authenticatedPage,
          "Test Project",
          "View Project",
        );

        await authenticatedPage.click("#editProjectButton");
        await authenticatedPage
          .locator("#projectNameInput")
          .fill("Test Project (Updated)");
        await saveAndWait(authenticatedPage);

        await expect(
          authenticatedPage.locator("#projectNameTag"),
        ).toContainText("Test Project (Updated)");

        // Verify persistence after reload
        await authenticatedPage.reload();
        await expect(
          authenticatedPage.locator("#projectNameTag"),
        ).toContainText("Test Project (Updated)");

        // Restore original name to avoid interfering with other tests
        await authenticatedPage.click("#editProjectButton");
        await authenticatedPage
          .locator("#projectNameInput")
          .fill("Test Project");
        await saveAndWait(authenticatedPage);
      },
    );

    testWithWorkspace(
      "should be able to update the Project description",
      async ({ authenticatedPage }) => {
        await navigateToSection(authenticatedPage, "Projects");
        await openItemFromTable(
          authenticatedPage,
          "Test Project",
          "View Project",
        );

        await authenticatedPage.click("#editProjectButton");
        await fillMDEditor(
          authenticatedPage,
          "#projectDescriptionInput",
          "Updated Project description",
        );
        await saveAndWait(authenticatedPage);

        // Verify by re-entering edit mode
        await authenticatedPage.click("#editProjectButton");
        await authenticatedPage
          .locator("#projectDescriptionInput textarea")
          .waitFor({ state: "visible", timeout: 5000 });
        await expect(
          authenticatedPage.locator("#projectDescriptionInput textarea"),
        ).toHaveValue("Updated Project description");
        await authenticatedPage.click('button:has-text("Cancel")');

        // Verify persistence after reload
        await authenticatedPage.reload();
        await authenticatedPage.click("#editProjectButton");
        await authenticatedPage
          .locator("#projectDescriptionInput textarea")
          .waitFor({ state: "visible", timeout: 5000 });
        await expect(
          authenticatedPage.locator("#projectDescriptionInput textarea"),
        ).toHaveValue("Updated Project description");

        // Restore original description to avoid interfering with other tests
        await fillMDEditor(
          authenticatedPage,
          "#projectDescriptionInput",
          "Description for Test Project",
        );
        await saveAndWait(authenticatedPage);
      },
    );
  });

  testWithWorkspace.describe("Edit entities", () => {
    async function createTestProject(
      page: Page,
      projectName: string,
    ): Promise<void> {
      await page.goto("/create/project");
      await page
        .locator("[data-testid='create-project-name']")
        .waitFor({ state: "visible", timeout: 10000 });
      await page
        .locator("[data-testid='create-project-name']")
        .fill(projectName);
      await page
        .locator('input[type="datetime-local"]')
        .fill("2023-10-01T12:00");
      await page
        .locator("[data-testid='create-project-description'] textarea")
        .fill("Test project for entity editing tests");
      await page.click("[data-testid='create-project-finish']");
      await page.waitForURL(/\/projects/, { timeout: 10000 });
      await page.waitForTimeout(1000);
    }

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

    testWithWorkspace(
      "should be able to add an Entity to a Project",
      async ({ authenticatedPage }) => {
        const projectName = getUniqueName("Project - Add Entity");
        const entityName = "Test Entity";

        await createTestProject(authenticatedPage, projectName);
        await navigateToSection(authenticatedPage, "Projects");
        await openItemFromTable(authenticatedPage, projectName, "View Project");
        await authenticatedPage.click("#editProjectButton");

        await addEntityToProject(authenticatedPage, entityName);

        // Verify entity added
        const table = authenticatedPage.locator(".data-table-scroll-container");
        await expect(table.locator(`text=${entityName}`)).toBeVisible({
          timeout: 10000,
        });

        // Verify persistence after reload
        await authenticatedPage.reload();
        await authenticatedPage.click("#editProjectButton");
        await expect(table.locator(`text=${entityName}`)).toBeVisible({
          timeout: 10000,
        });
      },
    );

    testWithWorkspace(
      "should be able to remove an Entity from a Project",
      async ({ authenticatedPage }) => {
        const projectName = getUniqueName("Project - Remove Entity");
        const entityName = "Test Child Entity";

        await createTestProject(authenticatedPage, projectName);
        await navigateToSection(authenticatedPage, "Projects");
        await openItemFromTable(authenticatedPage, projectName, "View Project");
        await authenticatedPage.click("#editProjectButton");

        // Add entity first
        await addEntityToProject(authenticatedPage, entityName);

        // Remove the entity
        await authenticatedPage.click("#editProjectButton");
        const table = authenticatedPage.locator(".data-table-scroll-container");
        const entityRow = table
          .locator(`text=${entityName}`)
          .locator("..")
          .locator("..")
          .first();
        await entityRow.locator('button[aria-label="Remove Entity"]').click();
        await saveAndWait(authenticatedPage);

        // Verify entity removed
        await authenticatedPage.reload();
        await authenticatedPage.click("#editProjectButton");
        await expect(
          authenticatedPage.locator(`text=${entityName}`),
        ).not.toBeVisible();
      },
    );

    testWithWorkspace(
      "should be able to remove a Project from an Entity via the Entity page",
      async ({ authenticatedPage }) => {
        const projectName = getUniqueName("Project - Remove via Entity");
        const entityName = "Test Parent Entity";

        await createTestProject(authenticatedPage, projectName);
        await navigateToSection(authenticatedPage, "Projects");
        await openItemFromTable(authenticatedPage, projectName, "View Project");
        await authenticatedPage.click("#editProjectButton");
        await addEntityToProject(authenticatedPage, entityName);

        // Navigate to entity page
        const table = authenticatedPage.locator(".data-table-scroll-container");
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
        await authenticatedPage.click("#editEntityButton");
        const projectsTable = authenticatedPage
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
        await saveAndWait(authenticatedPage);

        // Verify project no longer contains entity
        await navigateToSection(authenticatedPage, "Projects");
        await openItemFromTable(authenticatedPage, projectName, "View Project");
        await authenticatedPage.click("#editProjectButton");
        await expect(
          authenticatedPage.locator(`text=${entityName}`),
        ).not.toBeVisible();
      },
    );
  });
});
