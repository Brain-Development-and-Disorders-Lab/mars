// Playwright imports
import test, { expect } from "@playwright/test";

// Test helper functions
import { createTestUser, createTestWorkspace, switchWorkspace } from "../helpers";

test.describe("Interface launches", () => {
  test.beforeEach(async ({ context, page }) => {
    // Create User
    const user = await createTestUser(context);

    // Setup Workspace
    await createTestWorkspace("Dashboard-1", user);

    // Navigate to the dashboard
    await page.goto("/");
    await switchWorkspace(page, "Dashboard-1");
  });

  test("navigation menu items are visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#navSearchButtonDesktop")).toHaveText("Search");
    await expect(page.locator("#navProjectsButtonDesktop")).toHaveText("Projects");
  });
});
