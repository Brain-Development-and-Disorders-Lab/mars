import { test, expect } from "../fixtures";
import {
  navigateToSection,
  openItemFromTable,
  fillMDEditor,
  clickButtonByText,
} from "../helpers";

test.describe("Template", () => {
  test("renders the Template details correctly", async ({
    authenticatedPage,
  }) => {
    await navigateToSection(authenticatedPage, "Templates");
    await openItemFromTable(
      authenticatedPage,
      "Test Template",
      "View Template",
    );

    await expect(authenticatedPage.locator("h2")).toBeVisible();
    await expect(
      authenticatedPage.locator("#attributeNameInput"),
    ).toBeVisible();
    await expect(
      authenticatedPage.locator("#attributeDescriptionInput"),
    ).toBeVisible();
  });

  test("allows editing the Template", async ({ authenticatedPage }) => {
    await navigateToSection(authenticatedPage, "Templates");
    await openItemFromTable(
      authenticatedPage,
      "Test Template",
      "View Template",
    );

    // Get original name
    const originalName = await authenticatedPage.locator("h2").textContent();

    // Edit template
    await authenticatedPage.click("#editTemplateButton");
    await authenticatedPage
      .locator("#attributeNameInput")
      .fill("New Template Name");
    await fillMDEditor(
      authenticatedPage,
      "#attributeDescriptionInput",
      "New Description",
    );
    await authenticatedPage.click("#editTemplateButton");
    await expect(
      authenticatedPage.locator(".chakra-toast__root"),
    ).toContainText("Updated Successfully");

    // Revert changes
    await authenticatedPage.click("#editTemplateButton");
    await authenticatedPage
      .locator("#attributeNameInput")
      .fill(originalName || "");
    await fillMDEditor(
      authenticatedPage,
      "#attributeDescriptionInput",
      "Description for test Template",
    );
    await authenticatedPage.click("#editTemplateButton");
    await expect(
      authenticatedPage.locator(".chakra-toast__root"),
    ).toContainText("Updated Successfully");
  });

  test("exports the Template", async ({ authenticatedPage }) => {
    await navigateToSection(authenticatedPage, "Templates");
    await openItemFromTable(
      authenticatedPage,
      "Test Template",
      "View Template",
    );

    await authenticatedPage.click('[data-testid="templateActionsButton"]');
    await authenticatedPage.click('[data-value="export"]');
    await expect(
      authenticatedPage.locator(".chakra-toast__root"),
    ).toContainText("Generated JSON file");
  });

  test("archives the Template", async ({ authenticatedPage }) => {
    await navigateToSection(authenticatedPage, "Templates");
    await openItemFromTable(
      authenticatedPage,
      "Test Template",
      "View Template",
    );

    // Archive the template
    await authenticatedPage.click('[data-testid="templateActionsButton"]');
    await authenticatedPage.click('[data-value="archive"]');
    await clickButtonByText(authenticatedPage, "Confirm");
    await expect(
      authenticatedPage
        .locator(".chakra-toast__root")
        .filter({ hasText: "Archived Successfully" }),
    ).toBeVisible();

    // Restore it to avoid interfering with other tests
    await authenticatedPage.click("#restoreTemplateButton");
    await expect(
      authenticatedPage
        .locator(".chakra-toast__root")
        .filter({ hasText: "Restored Template successfully" }),
    ).toBeVisible();
  });
});
