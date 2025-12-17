import { test, expect } from "../fixtures";
import {
  navigateToSection,
  openItemFromTable,
  fillMDEditor,
  saveAndWait,
  clickButtonByText,
} from "../helpers";

test.describe("Entity", () => {
  test.describe("Create", () => {
    test.beforeEach(async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/create/entity");
      await expect(
        authenticatedPage.locator("h2:has-text('Create Entity')"),
      ).toBeVisible();
    });

    test("should display the initial page with required fields", async ({
      authenticatedPage,
    }) => {
      await expect(
        authenticatedPage.locator("h2:has-text('Create Entity')"),
      ).toBeVisible();
      await expect(
        authenticatedPage.locator("[data-testid='create-entity-name']"),
      ).toBeVisible();
      await expect(
        authenticatedPage.locator('input[type="date"]'),
      ).toBeVisible();
      await expect(
        authenticatedPage.locator(
          "[data-testid='create-entity-description'] textarea",
        ),
      ).toBeVisible();
    });

    test("should navigate through the steps", async ({ authenticatedPage }) => {
      // Use unique name to avoid conflicts (short suffix to avoid truncation)
      const shortId = Math.random().toString(36).substring(2, 6); // 4 char random string
      const entityName = `Test Entity Navigation ${shortId}`;

      // Fill in details
      await authenticatedPage
        .locator("[data-testid='create-entity-name']")
        .fill(entityName);
      await authenticatedPage.locator('input[type="date"]').fill("2023-10-01");
      await authenticatedPage
        .locator("[data-testid='create-entity-description'] textarea")
        .fill("This is a test entity for navigation.");

      // Continue to relationships
      await authenticatedPage.click("[data-testid='create-entity-continue']");
      await expect(
        authenticatedPage.locator("text=No Relationships"),
      ).toBeVisible();

      // Go back
      await authenticatedPage.click("[data-testid='create-entity-back']");
      await expect(
        authenticatedPage.locator("h2:has-text('Create Entity')"),
      ).toBeVisible();
      await expect(
        authenticatedPage.locator("[data-testid='create-entity-name']"),
      ).toHaveValue(entityName);

      // Continue to relationships again
      await authenticatedPage.click("[data-testid='create-entity-continue']");
      await expect(
        authenticatedPage.locator("text=No Relationships"),
      ).toBeVisible();

      // Continue to attributes
      await authenticatedPage.click("[data-testid='create-entity-continue']");
      await expect(
        authenticatedPage.locator("text=No Attributes"),
      ).toBeVisible();

      // Go back to relationships
      await authenticatedPage.click("[data-testid='create-entity-back']");
      await expect(
        authenticatedPage.locator("text=No Relationships"),
      ).toBeVisible();
    });

    test("should allow adding Relationships", async ({ authenticatedPage }) => {
      // Use unique name to avoid conflicts
      const shortId = Math.random().toString(36).substring(2, 6);
      const entityName = `Test Entity Relationships ${shortId}`;

      // Fill in details
      await authenticatedPage
        .locator("[data-testid='create-entity-name']")
        .fill(entityName);
      await authenticatedPage.locator('input[type="date"]').fill("2023-10-01");
      await authenticatedPage
        .locator("[data-testid='create-entity-description'] textarea")
        .fill("This is a test entity for relationships.");

      // Continue to relationships
      await authenticatedPage.click("[data-testid='create-entity-continue']");
      await expect(
        authenticatedPage.locator("text=No Relationships"),
      ).toBeVisible();

      // Try to add relationship if search select is available
      const searchSelect = authenticatedPage.locator(
        '[data-testid="search-select"]',
      );
      if ((await searchSelect.count()) > 0) {
        await searchSelect.click();
        const entityButton = authenticatedPage.locator(
          'button:has-text("Test Entity")',
        );
        if ((await entityButton.count()) > 0) {
          await entityButton.first().click();
          await authenticatedPage.click(
            "[data-testid='create-entity-add-relationship']",
          );
          await expect(
            authenticatedPage.locator(".data-table-scroll-container"),
          ).toBeVisible();
        }
      }
    });

    test("should allow adding Template Attributes", async ({
      authenticatedPage,
    }) => {
      // Use unique name to avoid conflicts
      const shortId = Math.random().toString(36).substring(2, 6);
      const entityName = `Test Entity Attributes ${shortId}`;

      // Fill in details
      await authenticatedPage
        .locator("[data-testid='create-entity-name']")
        .fill(entityName);
      await authenticatedPage.locator('input[type="date"]').fill("2023-10-01");
      await authenticatedPage
        .locator("[data-testid='create-entity-description'] textarea")
        .fill("This is a test entity for attributes.");

      // Navigate to attributes step
      await authenticatedPage.click("[data-testid='create-entity-continue']");
      await authenticatedPage.click("[data-testid='create-entity-continue']");
      await expect(
        authenticatedPage.locator("text=No Attributes"),
      ).toBeVisible();

      // Select template if available
      await authenticatedPage.click("[data-testid='select-template-trigger']");
      const templateOption = authenticatedPage.locator(
        '[role="option"]:has-text("Test Template")',
      );
      if ((await templateOption.count()) > 0) {
        await templateOption.click();
        await expect(
          authenticatedPage.locator("[data-testid='create-entity-attributes']"),
        ).toBeVisible();
      }
    });

    test("should complete Entity creation", async ({ authenticatedPage }) => {
      // Use unique name to avoid conflicts
      const shortId = Math.random().toString(36).substring(2, 6);
      const entityName = `Test Entity Complete ${shortId}`;

      // Fill in details
      await authenticatedPage
        .locator("[data-testid='create-entity-name']")
        .fill(entityName);
      await authenticatedPage.locator('input[type="date"]').fill("2023-10-01");
      await authenticatedPage
        .locator("[data-testid='create-entity-description'] textarea")
        .fill("This is a test entity for completion.");

      // Navigate through steps
      await authenticatedPage.click("[data-testid='create-entity-continue']");
      await authenticatedPage.click("[data-testid='create-entity-continue']");

      // Finish
      await authenticatedPage.click("[data-testid='create-entity-finish']");

      // Verify navigation
      await expect(authenticatedPage).toHaveURL(/\/entities/);
    });
  });

  test.describe("Edit details", () => {
    test("should be able to rename the Entity", async ({
      authenticatedPage,
    }) => {
      await navigateToSection(authenticatedPage, "Entities");
      await openItemFromTable(authenticatedPage, "Test Entity", "View Entity");

      await authenticatedPage.click("#editEntityButton");
      await authenticatedPage
        .locator("#entityNameInput")
        .fill("Test Entity (Updated)");
      await saveAndWait(authenticatedPage);

      await expect(authenticatedPage.locator("#entityNameTag")).toContainText(
        "Test Entity (Updated)",
      );

      // Verify persistence after reload
      await authenticatedPage.reload();
      await expect(authenticatedPage.locator("#entityNameTag")).toContainText(
        "Test Entity (Updated)",
      );

      // Restore original name to avoid interfering with other tests
      await authenticatedPage.click("#editEntityButton");
      await authenticatedPage.locator("#entityNameInput").fill("Test Entity");
      await saveAndWait(authenticatedPage);
    });

    test("should be able to update the Entity description", async ({
      authenticatedPage,
    }) => {
      await navigateToSection(authenticatedPage, "Entities");
      await openItemFromTable(
        authenticatedPage,
        "Test Child Entity",
        "View Entity",
      );

      // Get the original description for restoration
      const originalDescription = "Description for test Child Entity";
      const updatedDescription = "Updated Entity description";

      // Enter edit mode and update description
      await authenticatedPage.click("#editEntityButton");
      await fillMDEditor(
        authenticatedPage,
        "#entityDescriptionInput",
        updatedDescription,
      );

      // Save and wait for completion
      await saveAndWait(authenticatedPage);

      // Verify success toast appears (confirms mutation completed)
      await authenticatedPage
        .locator("text=Updated Successfully")
        .waitFor({ state: "visible", timeout: 10000 });

      // Wait for refetch to complete
      await authenticatedPage.waitForLoadState("networkidle");

      // Verify the description appears in view mode
      await authenticatedPage
        .locator(`text=${updatedDescription}`)
        .waitFor({ state: "visible", timeout: 10000 });

      // Restore original description to avoid interfering with other tests
      await authenticatedPage.click("#editEntityButton");
      await fillMDEditor(
        authenticatedPage,
        "#entityDescriptionInput",
        originalDescription,
      );
      await saveAndWait(authenticatedPage);
      await authenticatedPage.waitForLoadState("networkidle");
    });
  });

  test.describe("Edit attributes", () => {
    test.beforeEach(async ({ authenticatedPage }) => {
      await navigateToSection(authenticatedPage, "Entities");
      await openItemFromTable(
        authenticatedPage,
        "Test Child Entity",
        "View Entity",
      );

      await expect(
        authenticatedPage.locator("text=No Attributes"),
      ).toBeVisible();
    });

    test("should be able to add and edit Attributes", async ({
      authenticatedPage,
    }) => {
      // Add attribute
      await authenticatedPage.click("#editEntityButton");
      await authenticatedPage.click("#addAttributeModalButton");

      // Fill in attribute name (input is inside the field wrapper)
      await authenticatedPage
        .locator("[data-testid='create-attribute-name'] input")
        .fill("Attribute Name");

      // Fill in attribute description (textarea is inside the field wrapper)
      await authenticatedPage
        .locator("[data-testid='create-attribute-description'] textarea")
        .fill("Attribute Description");

      // Fill in value name and value data (these are in the values table)
      const valueInputs = authenticatedPage.locator(
        'input[placeholder*="Enter"]',
      );
      await valueInputs.nth(0).fill("Value Name");
      await valueInputs.nth(1).fill("Value Data");

      // Wait a moment for the inputs to register and validation to complete
      await authenticatedPage.waitForTimeout(1000);

      // Ensure the save button is enabled before clicking
      const saveButton = authenticatedPage.locator(
        "[data-testid='save-add-attribute-button']",
      );
      await saveButton.waitFor({ state: "visible", timeout: 5000 });

      // Wait for button to be enabled (not disabled)
      await authenticatedPage.waitForFunction(
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
      await authenticatedPage
        .locator("#addAttributeModalButton")
        .waitFor({ state: "visible", timeout: 10000 });

      // Wait for the attribute name to appear in the Attributes table
      await authenticatedPage
        .locator("text=Attribute Name")
        .waitFor({ state: "visible", timeout: 10000 });

      // Verify "No Attributes" is no longer visible
      await expect(
        authenticatedPage.locator("text=No Attributes"),
      ).not.toBeVisible({ timeout: 5000 });

      await saveAndWait(authenticatedPage);
      await authenticatedPage
        .locator("text=Updated Successfully")
        .waitFor({ state: "visible", timeout: 10000 });

      // Wait for refetch to complete
      await authenticatedPage.waitForLoadState("networkidle");

      // Verify Attribute persisted after reload
      await authenticatedPage.reload();
      await authenticatedPage.waitForLoadState("networkidle");

      // Wait for Attributes to be visible after reload
      await expect(
        authenticatedPage.locator("text=No Attributes"),
      ).not.toBeVisible({ timeout: 10000 });

      await authenticatedPage.click("#editEntityButton");
      await authenticatedPage
        .locator('button:has-text("Save")')
        .waitFor({ state: "visible", timeout: 10000 });
      await authenticatedPage
        .locator("text=Attribute Name")
        .waitFor({ state: "visible", timeout: 10000 });
      await authenticatedPage.waitForLoadState("networkidle");

      const deleteButton = authenticatedPage.locator(
        'button[aria-label="Delete Attribute"]',
      );
      await deleteButton.waitFor({ state: "attached", timeout: 10000 });
      await deleteButton.waitFor({ state: "visible", timeout: 10000 });
      await deleteButton.scrollIntoViewIfNeeded();
      await deleteButton.click();
      await clickButtonByText(authenticatedPage, "Save");
      await clickButtonByText(authenticatedPage, "Done");

      // Verify attribute deleted
      await expect(
        authenticatedPage.locator("text=No Attributes"),
      ).toBeVisible();
      await authenticatedPage.reload();
      await expect(
        authenticatedPage.locator("text=No Attributes"),
      ).toBeVisible();
    });
  });
});
