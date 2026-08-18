// Playwright imports
import test, { expect } from "@playwright/test";

// Test helper functions
import { getUniqueName, createTestUser, createTestWorkspace, switchWorkspace } from "../helpers/global.helpers";

test.describe("Project", () => {
  test.describe("Create", () => {
    test.beforeEach(async ({ context, page }) => {
      // Create User
      const user = await createTestUser(context);

      // Setup Workspace
      await createTestWorkspace("Project-1", user);

      // Setup navigation
      await switchWorkspace(page, "Project-1");
      await page.goto("/create/project");
      await expect(page.locator("h2:has-text('Create Project')")).toBeVisible();
    });

    test("should create a project with required fields", async ({ page }) => {
      await page.locator("[data-testid='create-project-name']").fill("1-Project-Create");
      await page.locator('input[type="datetime-local"]').fill("2023-10-01T12:00");
      await page.locator("[data-testid='create-project-description']").fill("This is a test project description.");
      await page.click("[data-testid='create-project-finish']");

      await expect(page).toHaveURL(/\/projects/);
    });

    test("should validate required fields", async ({ page }) => {
      await expect(page.locator("[data-testid='create-project-finish']")).toBeDisabled();

      await page.locator("[data-testid='create-project-name']").fill(getUniqueName("Project Name"));
      await expect(page.locator("[data-testid='create-project-finish']")).toBeDisabled();

      await page.locator("[data-testid='create-project-description']").fill("Test description");
      await page.locator('input[type="datetime-local"]').fill("2023-10-01T12:00");
      await expect(page.locator("[data-testid='create-project-finish']")).toBeEnabled();
    });

    test("should handle cancel button", async ({ page }) => {
      await page.locator("[data-testid='create-project-name']").fill(getUniqueName("Project Cancel"));
      await page.click("[data-testid='create-project-cancel']");

      // The filled name field guarantees the router blocker fires
      const continueButton = page.getByRole("button", { name: "Continue" });
      await continueButton.waitFor({ state: "visible", timeout: 5000 });
      await continueButton.click();

      await expect(page).toHaveURL(/\/projects/);
    });
  });
});
