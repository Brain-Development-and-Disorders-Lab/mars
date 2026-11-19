// Playwright imports
import test, { expect } from "@playwright/test";

// Test helper functions
import { clearUsers } from "../../../../server/test/helpers";

test.describe("Security, check endpoint access", () => {
  test("should not be able to access /setup", async ({ page }) => {
    await clearUsers();
    await page.goto("/setup");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("should not be able to access /", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
  });

  const protectedRoutes = [
    "/entities",
    "/entities/e1",
    "/projects",
    "/projects/p1",
    "/attributes",
    "/attributes/a1",
    "/workspaces/w1",
    "/search",
    "/profile",
    "/activity",
    "/admin",
    "/create",
    "/create/entity",
    "/create/attribute",
    "/create/project",
    "/create/workspace",
  ];

  for (const route of protectedRoutes) {
    test(`should not be able to access ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login$/);
    });
  }
});
