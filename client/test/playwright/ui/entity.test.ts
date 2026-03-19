// Playwright imports
import { test, expect } from "@playwright/test";

// Test helper functions
import {
  navigateToSection,
  openItemFromTable,
  fillMDEditor,
  saveAndWait,
  clickButtonByText,
  performLogin,
} from "../helpers";

test.describe("Entity", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure the user is logged in
    await performLogin(page);

    // Navigate to the dashboard
    await page.goto("/");
  });

  test.describe("Create", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/create/entity");
      await expect(page.locator("h2:has-text('Create Entity')")).toBeVisible();
    });

    test("should display the initial page with required fields", async ({
      page,
    }) => {
      await expect(page.locator("h2:has-text('Create Entity')")).toBeVisible();
      await expect(
        page.locator("[data-testid='create-entity-name']"),
      ).toBeVisible();
      await expect(page.locator('input[type="date"]')).toBeVisible();
      await expect(
        page.locator("[data-testid='create-entity-description'] textarea"),
      ).toBeVisible();
    });

    test("should navigate through the steps", async ({ page }) => {
      // Use unique name to avoid conflicts (short suffix to avoid truncation)
      const shortId = Math.random().toString(36).substring(2, 6); // 4 char random string
      const entityName = `Test Entity Navigation ${shortId}`;

      // Fill in details
      await page.locator("[data-testid='create-entity-name']").fill(entityName);
      await page.locator('input[type="date"]').fill("2023-10-01");
      await page
        .locator("[data-testid='create-entity-description'] textarea")
        .fill("This is a test entity for navigation.");

      // Continue to relationships
      await page.click("[data-testid='create-entity-continue']");
      await expect(page.locator("text=No Relationships")).toBeVisible();

      // Go back
      await page.click("[data-testid='create-entity-back']");
      await expect(page.locator("h2:has-text('Create Entity')")).toBeVisible();
      await expect(
        page.locator("[data-testid='create-entity-name']"),
      ).toHaveValue(entityName);

      // Continue to relationships again
      await page.click("[data-testid='create-entity-continue']");
      await expect(page.locator("text=No Relationships")).toBeVisible();

      // Continue to attributes
      await page.click("[data-testid='create-entity-continue']");
      await expect(page.locator("text=No Attributes")).toBeVisible();

      // Go back to relationships
      await page.click("[data-testid='create-entity-back']");
      await expect(page.locator("text=No Relationships")).toBeVisible();
    });

    test("should allow adding Relationships", async ({ page }) => {
      // Use unique name to avoid conflicts
      const shortId = Math.random().toString(36).substring(2, 6);
      const entityName = `Test Entity Relationships ${shortId}`;

      // Fill in details
      await page.locator("[data-testid='create-entity-name']").fill(entityName);
      await page.locator('input[type="date"]').fill("2023-10-01");
      await page
        .locator("[data-testid='create-entity-description'] textarea")
        .fill("This is a test entity for relationships.");

      // Continue to relationships
      await page.click("[data-testid='create-entity-continue']");
      await expect(page.locator("text=No Relationships")).toBeVisible();

      // Try to add relationship if search select is available
      const searchSelect = page.locator('[data-testid="search-select"]');
      if ((await searchSelect.count()) > 0) {
        await searchSelect.click();
        const entityButton = page.locator('button:has-text("Test Entity")');
        if ((await entityButton.count()) > 0) {
          await entityButton.first().click();
          await page.click("[data-testid='create-entity-add-relationship']");
          await expect(
            page.locator(".data-table-scroll-container"),
          ).toBeVisible();
        }
      }
    });

    test("should allow adding Template Attributes", async ({ page }) => {
      // Use unique name to avoid conflicts
      const shortId = Math.random().toString(36).substring(2, 6);
      const entityName = `Test Entity Attributes ${shortId}`;

      // Fill in details
      await page.locator("[data-testid='create-entity-name']").fill(entityName);
      await page.locator('input[type="date"]').fill("2023-10-01");
      await page
        .locator("[data-testid='create-entity-description'] textarea")
        .fill("This is a test entity for attributes.");

      // Navigate to attributes step
      await page.click("[data-testid='create-entity-continue']");
      await page.click("[data-testid='create-entity-continue']");
      await expect(page.locator("text=No Attributes")).toBeVisible();

      // Select template if available
      await page.click("[data-testid='select-template-trigger']");
      const templateOption = page.locator(
        '[role="option"]:has-text("Example Template")',
      );
      if ((await templateOption.count()) > 0) {
        await templateOption.click();
        await expect(
          page.locator("[data-testid='create-entity-attributes']"),
        ).toBeVisible();
      }
    });

    test("should complete Entity creation", async ({ page }) => {
      // Use unique name to avoid conflicts
      const shortId = Math.random().toString(36).substring(2, 6);
      const entityName = `Test Entity Complete ${shortId}`;

      // Fill in details
      await page.locator("[data-testid='create-entity-name']").fill(entityName);
      await page.locator('input[type="date"]').fill("2023-10-01");
      await page
        .locator("[data-testid='create-entity-description'] textarea")
        .fill("This is a test entity for completion.");

      // Navigate through steps
      await page.click("[data-testid='create-entity-continue']");
      await page.click("[data-testid='create-entity-continue']");

      // Finish
      await page.click("[data-testid='create-entity-finish']");

      // Verify navigation
      await expect(page).toHaveURL(/\/entities/);
    });
  });

  test.describe("Edit details", () => {
    test("should be able to rename the Entity", async ({ page }) => {
      await navigateToSection(page, "Entities");
      await openItemFromTable(page, "Test Entity", "View Entity");

      await page.click("#editEntityButton");
      await page.locator("#entityNameInput").fill("Test Entity (Updated)");
      await saveAndWait(page);

      await expect(page.locator("#entityNameTag")).toContainText(
        "Test Entity (Updated)",
      );

      // Verify persistence after reload
      await page.reload();
      await expect(page.locator("#entityNameTag")).toContainText(
        "Test Entity (Updated)",
      );

      // Restore original name to avoid interfering with other tests
      await page.click("#editEntityButton");
      await page.locator("#entityNameInput").fill("Test Entity");
      await saveAndWait(page);
    });

    test("should be able to update the Entity description", async ({
      page,
    }) => {
      await navigateToSection(page, "Entities");
      await openItemFromTable(page, "Test Entity", "View Entity");

      // Get the original description for restoration
      const originalDescription = "Description for test Entity";
      const updatedDescription = "Updated Entity description";

      // Enter edit mode and update description
      await page.click("#editEntityButton");
      await fillMDEditor(page, "#entityDescriptionInput", updatedDescription);

      // Save and wait for completion
      await saveAndWait(page);

      // Verify success toast appears (confirms mutation completed)
      await page
        .locator("text=Updated Successfully")
        .waitFor({ state: "visible", timeout: 10000 });

      // Wait for refetch to complete
      await page.waitForLoadState("networkidle");

      // Verify the description appears in view mode
      await page
        .locator(`text=${updatedDescription}`)
        .waitFor({ state: "visible", timeout: 10000 });

      // Restore original description to avoid interfering with other tests
      await page.click("#editEntityButton");
      await fillMDEditor(page, "#entityDescriptionInput", originalDescription);
      await saveAndWait(page);
      await page.waitForLoadState("networkidle");
    });
  });

  test.describe("Edit attributes", () => {
    test.beforeEach(async ({ page }) => {
      await navigateToSection(page, "Entities");
      await openItemFromTable(page, "Test Entity", "View Entity");

      await expect(page.locator("text=No Attributes")).toBeVisible();
    });

    test("should be able to add and edit Attributes", async ({ page }) => {
      // Add attribute
      await page.click("#editEntityButton");
      await page.click("#addAttributeModalButton");

      // Fill in attribute name (input is inside the field wrapper)
      await page
        .locator("[data-testid='create-attribute-name'] input")
        .fill("Attribute Name");

      // Fill in attribute description (textarea is inside the field wrapper)
      await page
        .locator("[data-testid='create-attribute-description'] textarea")
        .fill("Attribute Description");

      // Add new "Row" in Values area
      await page.click("#addValueRowButton");

      // Fill in value name and value data (these are in the values table)
      const valueInputs = page.locator('input[placeholder*="Enter"]');
      await valueInputs.nth(0).fill("Value Name");
      await valueInputs.nth(1).fill("Value Data");

      // Wait a moment for the inputs to register and validation to complete
      await page.waitForTimeout(1000);

      // Ensure the save button is enabled before clicking
      const saveButton = page.locator(
        "[data-testid='save-add-attribute-button']",
      );
      await saveButton.waitFor({ state: "visible", timeout: 5000 });

      // Wait for button to be enabled (not disabled)
      await page.waitForFunction(
        () => {
          const btn = document.querySelector(
            '[data-testid="save-add-attribute-button"]',
          ) as HTMLButtonElement;
          return btn && !btn.disabled;
        },
        { timeout: 5000 },
      );

      // Click save to add the attribute
      await saveButton.click();

      // Wait for the modal to close
      await page
        .locator("#addAttributeModalButton")
        .waitFor({ state: "visible", timeout: 10000 });

      // Wait for the attribute name to appear in the Attributes table
      await page
        .locator("text=Attribute Name")
        .waitFor({ state: "visible", timeout: 10000 });

      // Verify "No Attributes" is no longer visible
      await expect(page.locator("text=No Attributes")).not.toBeVisible({
        timeout: 5000,
      });

      await saveAndWait(page);
      await page
        .locator("text=Updated Successfully")
        .waitFor({ state: "visible", timeout: 10000 });

      // Wait for refetch to complete
      await page.waitForLoadState("networkidle");

      // Verify Attribute persisted after reload
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Wait for Attributes to be visible after reload
      await expect(page.locator("text=No Attributes")).not.toBeVisible({
        timeout: 10000,
      });

      await page.click("#editEntityButton");
      await page
        .locator('button:has-text("Save")')
        .waitFor({ state: "visible", timeout: 10000 });
      await page
        .locator("text=Attribute Name")
        .waitFor({ state: "visible", timeout: 10000 });
      await page.waitForLoadState("networkidle");

      const deleteButton = page.locator(
        'button[aria-label="Delete Attribute"]',
      );
      await deleteButton.waitFor({ state: "attached", timeout: 10000 });
      await deleteButton.waitFor({ state: "visible", timeout: 10000 });
      await deleteButton.scrollIntoViewIfNeeded();
      await deleteButton.click();
      await clickButtonByText(page, "Save");
      await clickButtonByText(page, "Done");

      // Verify attribute deleted
      await expect(page.locator("text=No Attributes")).toBeVisible();
      await page.reload();
      await expect(page.locator("text=No Attributes")).toBeVisible();
    });
  });
});
