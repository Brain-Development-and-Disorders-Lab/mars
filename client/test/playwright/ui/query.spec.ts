import { test, expect } from "../fixtures";
import { clickButtonByText } from "../helpers";

test.describe("Search Query Builder", () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/");
    await authenticatedPage.click("#navSearchButtonDesktop");
    await clickButtonByText(authenticatedPage, "Query Builder");
  });

  test("should build a query with 1 Name inclusion rule", async ({
    authenticatedPage,
  }) => {
    // Verify default empty state
    await expect(
      authenticatedPage.locator(".css-1ofqig9 > .chakra-heading"),
    ).not.toBeVisible();

    // Create query
    await clickButtonByText(authenticatedPage, "Rule");
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
  });

  test("should build a query with Name exclusion rules", async ({
    authenticatedPage,
  }) => {
    await expect(
      authenticatedPage.locator(".css-1ofqig9 > .chakra-heading"),
    ).not.toBeVisible();

    // First exclusion rule: exclude names containing "Entity"
    await clickButtonByText(authenticatedPage, "Rule");
    await authenticatedPage
      .locator(".rule-operators > select")
      .selectOption("does not contain");
    await authenticatedPage
      .locator('[data-testid="value-editor"]')
      .fill("Entity");

    // Second exclusion rule: exclude names containing "Box"
    await clickButtonByText(authenticatedPage, "Rule");
    await authenticatedPage
      .locator(".rule-operators > select")
      .nth(1)
      .selectOption("does not contain");
    await authenticatedPage
      .locator('[data-testid="value-editor"]')
      .nth(1)
      .fill("Box");

    await authenticatedPage.click('[aria-label="Run Query"]');

    await expect(authenticatedPage.locator("#resultsContainer")).toContainText(
      "No results found",
    );
  });

  test("should build a query with Name inclusion and Attribute Value (Text) inclusion rule", async ({
    authenticatedPage,
  }) => {
    await expect(
      authenticatedPage.locator(".css-1ofqig9 > .chakra-heading"),
    ).not.toBeVisible();

    // First rule
    await clickButtonByText(authenticatedPage, "Rule");
    await authenticatedPage
      .locator(".rule-operators > select")
      .selectOption("contains");
    await authenticatedPage
      .locator('[data-testid="value-editor"]')
      .fill("Entity");

    // Second rule
    await clickButtonByText(authenticatedPage, "Rule");
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
  });

  test("should build a query with Name inclusion and Attribute Value (Number) inclusion rule", async ({
    authenticatedPage,
  }) => {
    // Navigate back to search
    await authenticatedPage.goto("/");
    await authenticatedPage.click("#navSearchButtonDesktop");
    await clickButtonByText(authenticatedPage, "Query Builder");

    await expect(
      authenticatedPage.locator(".css-1ofqig9 > .chakra-heading"),
    ).not.toBeVisible();

    // First rule
    await clickButtonByText(authenticatedPage, "Rule");
    await authenticatedPage
      .locator(".rule-operators > select")
      .selectOption("contains");
    await authenticatedPage
      .locator('[data-testid="value-editor"]')
      .fill("Entity");

    // Second rule
    await clickButtonByText(authenticatedPage, "Rule");
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
      .fill("5");

    await authenticatedPage.click('[aria-label="Run Query"]');

    await expect(authenticatedPage.locator("#resultsHeading")).toContainText(
      "1 result",
    );
  });
});
