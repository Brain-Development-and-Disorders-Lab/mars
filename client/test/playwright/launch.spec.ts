import { test, expect } from "./fixtures";

test.describe("Interface launches", () => {
  test("navigation menu items are visible", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/");
    await expect(
      authenticatedPage.locator("#navSearchButtonDesktop"),
    ).toHaveText("Search");
    await expect(
      authenticatedPage.locator("#navProjectsButtonDesktop"),
    ).toHaveText("Projects");
  });
});
