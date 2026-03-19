// Playwright imports
import test, { expect } from "@playwright/test";

// Test helper functions
import { performLogin } from "../helpers";

test.describe("Interface launches", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure the user is logged in
    await performLogin(page);

    // Navigate to the dashboard
    await page.goto("/");
  });

  test("navigation menu items are visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#navSearchButtonDesktop")).toHaveText("Search");
    await expect(page.locator("#navProjectsButtonDesktop")).toHaveText(
      "Projects",
    );
  });
});
