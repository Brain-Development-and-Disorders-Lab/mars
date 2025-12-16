import { testWithWorkspace, expect } from "../fixtures";

testWithWorkspace.describe("Template", () => {
  testWithWorkspace(
    "renders the Template details correctly",
    async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/");
      await authenticatedPage.click('button:has-text("Templates")');
      await authenticatedPage
        .locator(".data-table-scroll-container")
        .locator('button[aria-label="View Template"]')
        .first()
        .click();

      await expect(authenticatedPage.locator("h2")).toBeVisible();
      await expect(
        authenticatedPage.locator("#attributeNameInput"),
      ).toBeVisible();
      await expect(
        authenticatedPage.locator("#attributeDescriptionInput"),
      ).toBeVisible();
    },
  );

  testWithWorkspace(
    "allows editing the Template",
    async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/");
      await authenticatedPage.click('button:has-text("Templates")');
      await authenticatedPage
        .locator(".data-table-scroll-container")
        .locator('button[aria-label="View Template"]')
        .first()
        .click();

      // Get original name
      const originalName = await authenticatedPage.locator("h2").textContent();

      // Edit template
      await authenticatedPage.click("#editTemplateButton");
      await authenticatedPage
        .locator("#attributeNameInput")
        .fill("New Template Name");
      // MDEditor textarea is inside the wrapper
      const descriptionTextarea = authenticatedPage.locator(
        "#attributeDescriptionInput textarea",
      );
      await descriptionTextarea.waitFor({ state: "visible", timeout: 5000 });
      await descriptionTextarea.click();
      await descriptionTextarea.clear();
      await descriptionTextarea.fill("New Description");
      await authenticatedPage.click("#editTemplateButton");
      await expect(
        authenticatedPage.locator(".chakra-toast__root"),
      ).toContainText("Updated Successfully");

      // Revert changes
      await authenticatedPage.click("#editTemplateButton");
      await authenticatedPage
        .locator("#attributeNameInput")
        .fill(originalName || "");
      const revertDescriptionTextarea = authenticatedPage.locator(
        "#attributeDescriptionInput textarea",
      );
      await revertDescriptionTextarea.waitFor({
        state: "visible",
        timeout: 5000,
      });
      await revertDescriptionTextarea.click();
      await revertDescriptionTextarea.clear();
      await revertDescriptionTextarea.fill("Description for test Template");
      await authenticatedPage.click("#editTemplateButton");
      await expect(
        authenticatedPage.locator(".chakra-toast__root"),
      ).toContainText("Updated Successfully");
    },
  );

  testWithWorkspace("exports the Template", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/");
    await authenticatedPage.click('button:has-text("Templates")');
    // Use the first template for export
    await authenticatedPage
      .locator(".data-table-scroll-container")
      .locator('button[aria-label="View Template"]')
      .first()
      .click();

    await authenticatedPage.click('[data-testid="templateActionsButton"]');
    await authenticatedPage.click('[data-value="export"]');
    await expect(
      authenticatedPage.locator(".chakra-toast__root"),
    ).toContainText("Generated JSON file");
  });

  testWithWorkspace("archives the Template", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/");
    await authenticatedPage.click('button:has-text("Templates")');
    await authenticatedPage
      .locator(".data-table-scroll-container")
      .locator('button[aria-label="View Template"]')
      .first()
      .click();

    // Archive the template
    await authenticatedPage.click('[data-testid="templateActionsButton"]');
    await authenticatedPage.click('[data-value="archive"]');
    await authenticatedPage.click('button:has-text("Confirm")');
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
