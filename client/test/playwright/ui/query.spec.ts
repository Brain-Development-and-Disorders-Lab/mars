import { testWithWorkspace, expect } from "../fixtures";
import { navigateToSection, openItemFromTable, saveAndWait } from "../helpers";

testWithWorkspace.describe("Search Query Builder", () => {
  testWithWorkspace.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/");
    await authenticatedPage.click("#navSearchButtonDesktop");
    await authenticatedPage.click('button:has-text("Query Builder")');
  });

  testWithWorkspace(
    "should build a query with 1 Name inclusion rule",
    async ({ authenticatedPage }) => {
      // Verify default empty state
      await expect(
        authenticatedPage.locator(".css-1ofqig9 > .chakra-heading"),
      ).not.toBeVisible();

      // Create query
      await authenticatedPage.click('button:has-text("Rule")');
      await authenticatedPage
        .locator(".rule-operators > select")
        .selectOption("contains");
      await authenticatedPage
        .locator('[data-testid="value-editor"]')
        .fill("Entity");
      await authenticatedPage.click('[aria-label="Run Query"]');

      // Verify results
      await expect(authenticatedPage.locator("#resultsHeading")).toContainText(
        "5 results",
      );
    },
  );

  testWithWorkspace(
    "should build a query with Name exclusion rules",
    async ({ authenticatedPage }) => {
      await expect(
        authenticatedPage.locator(".css-1ofqig9 > .chakra-heading"),
      ).not.toBeVisible();

      // First exclusion rule: exclude names containing "Entity"
      await authenticatedPage.click('button:has-text("Rule")');
      await authenticatedPage
        .locator(".rule-operators > select")
        .selectOption("does not contain");
      await authenticatedPage
        .locator('[data-testid="value-editor"]')
        .fill("Entity");

      // Second exclusion rule: exclude names containing "Box"
      await authenticatedPage.click('button:has-text("Rule")');
      await authenticatedPage
        .locator(".rule-operators > select")
        .nth(1)
        .selectOption("does not contain");
      await authenticatedPage
        .locator('[data-testid="value-editor"]')
        .nth(1)
        .fill("Box");

      await authenticatedPage.click('[aria-label="Run Query"]');

      await expect(
        authenticatedPage.locator("#resultsContainer"),
      ).toContainText("No results found");
    },
  );

  testWithWorkspace(
    "should build a query with Name inclusion and Attribute Value (Text) inclusion rule",
    async ({ authenticatedPage }) => {
      await expect(
        authenticatedPage.locator(".css-1ofqig9 > .chakra-heading"),
      ).not.toBeVisible();

      // First rule
      await authenticatedPage.click('button:has-text("Rule")');
      await authenticatedPage
        .locator(".rule-operators > select")
        .selectOption("contains");
      await authenticatedPage
        .locator('[data-testid="value-editor"]')
        .fill("Entity");

      // Second rule
      await authenticatedPage.click('button:has-text("Rule")');
      await authenticatedPage
        .locator(".rule-fields > select")
        .nth(1)
        .selectOption("Attributes");
      await authenticatedPage
        .locator(".rule-operators > select")
        .nth(1)
        .selectOption("contains");

      // Configure attribute value
      await authenticatedPage.click('[data-testid="rule-value-type-trigger"]');
      await authenticatedPage.click('[role="option"]:has-text("Text")');
      await authenticatedPage.click(
        '[data-testid="rule-value-operators-trigger"]',
      );
      await authenticatedPage.click('[role="option"]:has-text("contains")');
      await authenticatedPage
        .locator('[data-testid="value-editor"]')
        .nth(1)
        .fill("Test");

      await authenticatedPage.click('[aria-label="Run Query"]');

      await expect(authenticatedPage.locator("#resultsHeading")).toContainText(
        "2 results",
      );
    },
  );

  testWithWorkspace(
    "should build a query with Name inclusion and Attribute Value (Number) inclusion rule",
    async ({ authenticatedPage }) => {
      // Ensure "Test Entity" has a number attribute with value > 120
      // The seed data should create this, but we verify and add if needed
      await navigateToSection(authenticatedPage, "Entities");
      await openItemFromTable(authenticatedPage, "Test Entity", "View Entity");

      await authenticatedPage.click("#editEntityButton");

      // Check if "Test Attribute" exists with a number value > 120
      const attributeTable = authenticatedPage
        .locator(".data-table-scroll-container")
        .filter({ hasText: "Test Attribute" });
      const hasAttribute = (await attributeTable.count()) > 0;

      if (!hasAttribute) {
        // Add attribute with number value
        await authenticatedPage.click("#addAttributeModalButton");
        await authenticatedPage
          .locator("[data-testid='create-attribute-name'] input")
          .fill("Test Attribute");
        await authenticatedPage
          .locator("[data-testid='create-attribute-description'] textarea")
          .fill("Test Attribute description");

        // Add number value
        await authenticatedPage.click('button:has-text("Add Value")');
        const valueTypeSelect = authenticatedPage.locator("select").last();
        await valueTypeSelect.selectOption("number");

        const valueInputs = authenticatedPage.locator(
          'input[placeholder*="Enter"]',
        );
        await valueInputs.nth(0).fill("Test Number Value");
        await valueInputs.nth(1).fill("123"); // Value > 120

        await authenticatedPage.click(
          "[data-testid='save-add-attribute-button']",
        );
        await saveAndWait(authenticatedPage);
      } else {
        // Verify number value exists and is > 120
        const numberInput = attributeTable
          .locator('input[type="number"]')
          .first();
        const currentValue = await numberInput.inputValue();
        if (!currentValue || parseFloat(currentValue) <= 120) {
          await numberInput.fill("123");
          await saveAndWait(authenticatedPage);
        } else {
          await authenticatedPage.click('button:has-text("Cancel")');
        }
      }

      // Navigate back to search
      await authenticatedPage.goto("/");
      await authenticatedPage.click("#navSearchButtonDesktop");
      await authenticatedPage.click('button:has-text("Query Builder")');

      await expect(
        authenticatedPage.locator(".css-1ofqig9 > .chakra-heading"),
      ).not.toBeVisible();

      // First rule
      await authenticatedPage.click('button:has-text("Rule")');
      await authenticatedPage
        .locator(".rule-operators > select")
        .selectOption("contains");
      await authenticatedPage
        .locator('[data-testid="value-editor"]')
        .fill("Entity");

      // Second rule
      await authenticatedPage.click('button:has-text("Rule")');
      await authenticatedPage
        .locator(".rule-fields > select")
        .nth(1)
        .selectOption("Attributes");
      await authenticatedPage
        .locator(".rule-operators > select")
        .nth(1)
        .selectOption("contains");

      // Configure attribute value
      await authenticatedPage.click('[data-testid="rule-value-type-trigger"]');
      await authenticatedPage.click('[role="option"]:has-text("Number")');
      await authenticatedPage.click(
        '[data-testid="rule-value-operators-trigger"]',
      );
      await authenticatedPage.click('[role="option"]:has-text(">")');
      await authenticatedPage
        .locator('[data-testid="value-editor"]')
        .nth(1)
        .fill("120");

      await authenticatedPage.click('[aria-label="Run Query"]');

      await expect(authenticatedPage.locator("#resultsHeading")).toContainText(
        "1 result",
      );
    },
  );
});
