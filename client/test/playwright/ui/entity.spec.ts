import { testWithWorkspace, expect } from "../fixtures";
import {
  navigateToSection,
  openItemFromTable,
  fillMDEditor,
  saveAndWait,
} from "../helpers";

testWithWorkspace.describe("Entity", () => {
  testWithWorkspace.describe("Create", () => {
    testWithWorkspace.beforeEach(async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/create/entity");
      await expect(
        authenticatedPage.locator("h2:has-text('Create Entity')"),
      ).toBeVisible();
    });

    testWithWorkspace(
      "should display the initial page with required fields",
      async ({ authenticatedPage }) => {
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
      },
    );

    testWithWorkspace(
      "should navigate through the steps",
      async ({ authenticatedPage }) => {
        // Use unique name to avoid conflicts (short suffix to avoid truncation)
        const shortId = Math.random().toString(36).substring(2, 6); // 4 char random string
        const entityName = `Test Entity Navigation ${shortId}`;

        // Fill in details
        await authenticatedPage
          .locator("[data-testid='create-entity-name']")
          .fill(entityName);
        await authenticatedPage
          .locator('input[type="date"]')
          .fill("2023-10-01");
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
      },
    );

    testWithWorkspace(
      "should allow adding Relationships",
      async ({ authenticatedPage }) => {
        // Use unique name to avoid conflicts (short suffix to avoid truncation)
        const shortId = Math.random().toString(36).substring(2, 6); // 4 char random string
        const entityName = `Test Entity Relationships ${shortId}`;

        // Fill in details
        await authenticatedPage
          .locator("[data-testid='create-entity-name']")
          .fill(entityName);
        await authenticatedPage
          .locator('input[type="date"]')
          .fill("2023-10-01");
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
      },
    );

    testWithWorkspace(
      "should allow adding Template Attributes",
      async ({ authenticatedPage }) => {
        // Use unique name to avoid conflicts (short suffix to avoid truncation)
        const shortId = Math.random().toString(36).substring(2, 6); // 4 char random string
        const entityName = `Test Entity Attributes ${shortId}`;

        // Fill in details
        await authenticatedPage
          .locator("[data-testid='create-entity-name']")
          .fill(entityName);
        await authenticatedPage
          .locator('input[type="date"]')
          .fill("2023-10-01");
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
        await authenticatedPage.click(
          "[data-testid='select-template-trigger']",
        );
        const templateOption = authenticatedPage.locator(
          '[role="option"]:has-text("Test Template")',
        );
        if ((await templateOption.count()) > 0) {
          await templateOption.click();
          await expect(
            authenticatedPage.locator(
              "[data-testid='create-entity-attributes']",
            ),
          ).toBeVisible();
        }
      },
    );

    testWithWorkspace(
      "should complete Entity creation",
      async ({ authenticatedPage }) => {
        // Use unique name to avoid conflicts (short suffix to avoid truncation)
        const shortId = Math.random().toString(36).substring(2, 6); // 4 char random string
        const entityName = `Test Entity Complete ${shortId}`;

        // Fill in details
        await authenticatedPage
          .locator("[data-testid='create-entity-name']")
          .fill(entityName);
        await authenticatedPage
          .locator('input[type="date"]')
          .fill("2023-10-01");
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
      },
    );
  });

  testWithWorkspace.describe("Edit details", () => {
    testWithWorkspace(
      "should be able to rename the Entity",
      async ({ authenticatedPage }) => {
        await navigateToSection(authenticatedPage, "Entities");
        await openItemFromTable(
          authenticatedPage,
          "Test Entity",
          "View Entity",
        );

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
      },
    );

    testWithWorkspace(
      "should be able to update the Entity description",
      async ({ authenticatedPage }) => {
        await navigateToSection(authenticatedPage, "Entities");
        await openItemFromTable(
          authenticatedPage,
          "Test Child Entity",
          "View Entity",
        );

        await authenticatedPage.click("#editEntityButton");
        await fillMDEditor(
          authenticatedPage,
          "#entityDescriptionInput",
          "Updated Entity description",
        );
        await saveAndWait(authenticatedPage);

        // Verify by re-entering edit mode
        await authenticatedPage.click("#editEntityButton");
        await authenticatedPage
          .locator("#entityDescriptionInput textarea")
          .waitFor({ state: "visible", timeout: 5000 });
        await expect(
          authenticatedPage.locator("#entityDescriptionInput textarea"),
        ).toHaveValue("Updated Entity description");
        await authenticatedPage.click('button:has-text("Cancel")');

        // Verify persistence after reload
        await authenticatedPage.reload();
        await authenticatedPage.click("#editEntityButton");
        await authenticatedPage
          .locator("#entityDescriptionInput textarea")
          .waitFor({ state: "visible", timeout: 5000 });
        await expect(
          authenticatedPage.locator("#entityDescriptionInput textarea"),
        ).toHaveValue("Updated Entity description");

        // Restore original description to avoid interfering with other tests
        await fillMDEditor(
          authenticatedPage,
          "#entityDescriptionInput",
          "Description for test Child Entity",
        );
        await saveAndWait(authenticatedPage);
      },
    );
  });

  testWithWorkspace.describe("Edit attributes", () => {
    testWithWorkspace.beforeEach(async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/");
      await authenticatedPage.click('button:has-text("Entities")');

      // Find and click on "Test Child Entity"
      const table = authenticatedPage.locator(".data-table-scroll-container");
      const entityRow = table
        .locator("text=Test Child Entity")
        .locator("..")
        .locator("..");
      await entityRow.locator('button[aria-label="View Entity"]').click();

      await expect(
        authenticatedPage.locator("text=No Attributes"),
      ).toBeVisible();
    });

    testWithWorkspace(
      "should be able to add and edit Attributes",
      async ({ authenticatedPage }) => {
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

        await authenticatedPage.click(
          "[data-testid='save-add-attribute-button']",
        );

        // Verify attribute added
        await expect(
          authenticatedPage.locator("text=No Attributes"),
        ).not.toBeVisible();
        await authenticatedPage.click("#editEntityButton");
        await authenticatedPage.click('button:has-text("Done")');
        await authenticatedPage.reload();
        await expect(
          authenticatedPage.locator("text=No Attributes"),
        ).not.toBeVisible();

        // Delete attribute
        await authenticatedPage.click("#editEntityButton");
        await authenticatedPage.click('button[aria-label="Delete Attribute"]');
        await authenticatedPage.click('button:has-text("Save")');
        await authenticatedPage.click('button:has-text("Done")');

        // Verify attribute deleted
        await expect(
          authenticatedPage.locator("text=No Attributes"),
        ).toBeVisible();
        await authenticatedPage.reload();
        await expect(
          authenticatedPage.locator("text=No Attributes"),
        ).toBeVisible();
      },
    );
  });
});
