// Playwright imports
import test, { expect } from "@playwright/test";

// Test helper functions
import { clickButtonByText } from "../helpers";

test.describe("Search Query Builder", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.click("#navSearchButtonDesktop");
    await clickButtonByText(page, "Query Builder");
  });

  test("should build a query with 1 Name inclusion rule", async ({ page }) => {
    // Verify default empty state
    await expect(
      page.locator(".css-1ofqig9 > .chakra-heading"),
    ).not.toBeVisible();

    // Create query
    await clickButtonByText(page, "Rule");
    await page.locator(".rule-operators > select").selectOption("contains");
    await page.locator('[data-testid="value-editor"]').fill("Entity");
    await page.click('[aria-label="Run Query"]');

    // Verify results
    await expect(page.locator("#resultsHeading")).toContainText("5 results");
  });

  test("should build a query with Name exclusion rules", async ({ page }) => {
    await expect(
      page.locator(".css-1ofqig9 > .chakra-heading"),
    ).not.toBeVisible();

    // First exclusion rule: exclude names containing "Entity"
    await clickButtonByText(page, "Rule");
    await page
      .locator(".rule-operators > select")
      .selectOption("does not contain");
    await page.locator('[data-testid="value-editor"]').fill("Entity");

    // Second exclusion rule: exclude names containing "Box"
    await clickButtonByText(page, "Rule");
    await page
      .locator(".rule-operators > select")
      .nth(1)
      .selectOption("does not contain");
    await page.locator('[data-testid="value-editor"]').nth(1).fill("Box");

    await page.click('[aria-label="Run Query"]');

    await expect(page.locator("#resultsContainer")).toContainText(
      "No results found",
    );
  });

  test("should build a query with Name inclusion and Attribute Value (Text) inclusion rule", async ({
    page,
  }) => {
    await expect(
      page.locator(".css-1ofqig9 > .chakra-heading"),
    ).not.toBeVisible();

    // First rule
    await clickButtonByText(page, "Rule");
    await page.locator(".rule-operators > select").selectOption("contains");
    await page.locator('[data-testid="value-editor"]').fill("Entity");

    // Second rule
    await clickButtonByText(page, "Rule");
    await page
      .locator(".rule-fields > select")
      .nth(1)
      .selectOption("Attributes");
    await page
      .locator(".rule-operators > select")
      .nth(1)
      .selectOption("contains");

    // Configure attribute value
    await page.click('[data-testid="rule-value-type-trigger"]');
    await page.click('[role="option"]:has-text("Text")');
    await page.click('[data-testid="rule-value-operators-trigger"]');
    await page.click('[role="option"]:has-text("contains")');
    await page.locator('[data-testid="value-editor"]').nth(1).fill("Test");

    await page.click('[aria-label="Run Query"]');

    await expect(page.locator("#resultsHeading")).toContainText("2 results");
  });

  test("should build a query with Name inclusion and Attribute Value (Number) inclusion rule", async ({
    page,
  }) => {
    // Navigate back to search
    await page.goto("/");
    await page.click("#navSearchButtonDesktop");
    await clickButtonByText(page, "Query Builder");

    await expect(
      page.locator(".css-1ofqig9 > .chakra-heading"),
    ).not.toBeVisible();

    // First rule
    await clickButtonByText(page, "Rule");
    await page.locator(".rule-operators > select").selectOption("contains");
    await page.locator('[data-testid="value-editor"]').fill("Entity");

    // Second rule
    await clickButtonByText(page, "Rule");
    await page
      .locator(".rule-fields > select")
      .nth(1)
      .selectOption("Attributes");
    await page
      .locator(".rule-operators > select")
      .nth(1)
      .selectOption("contains");

    // Configure attribute value
    await page.click('[data-testid="rule-value-type-trigger"]');
    await page.click('[role="option"]:has-text("Number")');
    await page.click('[data-testid="rule-value-operators-trigger"]');
    await page.click('[role="option"]:has-text(">")');
    await page.locator('[data-testid="value-editor"]').nth(1).fill("5");

    await page.click('[aria-label="Run Query"]');

    await expect(page.locator("#resultsHeading")).toContainText("1 result");
  });
});
