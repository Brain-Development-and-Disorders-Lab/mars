import { test, expect } from "@playwright/test";

import {
  navigateToSection,
  openItemFromTable,
  fillMDEditor,
  clickButtonByText,
  performLogin,
} from "../helpers";

test.describe("Template", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure the user is logged in
    await performLogin(page);

    // Navigate to the dashboard
    await page.goto("/");
  });

  test("renders the Template details correctly", async ({ page }) => {
    await navigateToSection(page, "Templates");
    await openItemFromTable(page, "Example Template", "View Template");

    await expect(page.locator("h2")).toBeVisible();
    await expect(page.locator("#attributeNameInput")).toBeVisible();
    await expect(page.locator("#attributeDescriptionInput")).toBeVisible();
  });

  test("allows editing the Template", async ({ page }) => {
    await navigateToSection(page, "Templates");
    await openItemFromTable(page, "Example Template", "View Template");

    // Get original name
    const originalName = await page.locator("h2").textContent();

    // Edit template
    await page.click("#editTemplateButton");
    await page.locator("#attributeNameInput").fill("New Template Name");
    await fillMDEditor(page, "#attributeDescriptionInput", "New Description");
    await page.click("#editTemplateButton");
    await expect(
      page
        .locator(".chakra-toast__root")
        .filter({ hasText: "Updated Successfully" })
        .first(),
    ).toBeVisible();

    // Revert changes
    await page.click("#editTemplateButton");
    await page.locator("#attributeNameInput").fill(originalName || "");
    await fillMDEditor(
      page,
      "#attributeDescriptionInput",
      "Description for test Template",
    );
    await page.click("#editTemplateButton");
    await expect(
      page
        .locator(".chakra-toast__root")
        .filter({ hasText: "Updated Successfully" })
        .first(),
    ).toBeVisible();
  });

  test("exports the Template", async ({ page }) => {
    await navigateToSection(page, "Templates");
    await openItemFromTable(page, "Example Template", "View Template");

    await page.click('[data-testid="templateActionsButton"]');
    await page.click('[data-value="export"]');
    await expect(page.locator(".chakra-toast__root")).toContainText(
      "Generated JSON file",
    );
  });

  test("archives the Template", async ({ page }) => {
    await navigateToSection(page, "Templates");
    await openItemFromTable(page, "Example Template", "View Template");

    // Archive the template
    await page.click('[data-testid="templateActionsButton"]');
    await page.click('[data-value="archive"]');
    await clickButtonByText(page, "Confirm");
    await expect(
      page
        .locator(".chakra-toast__root")
        .filter({ hasText: "Archived Successfully" }),
    ).toBeVisible();

    // Restore it to avoid interfering with other tests
    await page.click("#restoreTemplateButton");
    await expect(
      page
        .locator(".chakra-toast__root")
        .filter({ hasText: "Restored Template successfully" }),
    ).toBeVisible();
  });
});
