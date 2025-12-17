import { test, expect } from "../fixtures";
import { clearUsers } from "../../../../server/test/util";

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
    "/projects",
    "/templates",
    "/search",
    "/profile",
    "/activity",
    "/create",
    "/create/entity",
    "/create/template",
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
