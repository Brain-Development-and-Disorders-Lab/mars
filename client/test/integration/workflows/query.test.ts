// Playwright imports
import test, { expect } from "@playwright/test";

// Test helper functions
import {
  clickButtonByText,
  createTestEntity,
  createTestWorkspace,
  createTestUser,
  selectChakraSelectOption,
} from "../helpers";

test.describe("Search Query Builder", () => {
  test.beforeEach(async ({ context, page }) => {
    // Create User
    const user = await createTestUser(context);

    // Perform setup of the test environment
    const workspace = await createTestWorkspace("query", user);
    await createTestEntity("1-Entity-Query", user, workspace);

    // Navigate to the base page
    await page.goto("/");
    await page.click("#navSearchButtonDesktop");
    await clickButtonByText(page, "Query Builder");
  });

  test("should build a query with 1 Name inclusion rule", async ({ page }) => {
    await expect(page.getByText("No Rules")).toBeVisible();

    await clickButtonByText(page, "Add Rule");
    await page.locator('[data-testid="rule-value-input"]').first().fill("Entity");
    await page.click('[aria-label="Run Query"]');

    await expect(page.locator("#resultsHeading")).toContainText("1 result");
  });

  test("should build a query with Name exclusion rules", async ({ page }) => {
    await expect(page.getByText("No Rules")).toBeVisible();

    await clickButtonByText(page, "Add Rule");
    await selectChakraSelectOption(
      page,
      page.locator('[data-testid="rule-operator-select"]').first(),
      "does not contain",
    );
    await page.locator('[data-testid="rule-value-input"]').first().fill("Entity");

    await clickButtonByText(page, "Add Rule");
    await selectChakraSelectOption(
      page,
      page.locator('[data-testid="rule-operator-select"]').nth(1),
      "does not contain",
    );
    await page.locator('[data-testid="rule-value-input"]').nth(1).fill("Box");

    await page.click('[aria-label="Run Query"]');

    await expect(page.locator("#resultsContainer")).toContainText("No results found");
  });

  test("should build a query with Name inclusion and Attribute Value (Text) inclusion rule", async ({ page }) => {
    await expect(page.getByText("No Rules")).toBeVisible();

    await clickButtonByText(page, "Add Rule");
    await page.locator('[data-testid="rule-value-input"]').first().fill("Entity");

    await clickButtonByText(page, "Add Rule");
    await selectChakraSelectOption(page, page.locator('[data-testid="rule-field-select"]').nth(1), "attributes");
    await selectChakraSelectOption(page, page.locator('[data-testid="rule-attr-type-select"]'), "text");
    await selectChakraSelectOption(page, page.locator('[data-testid="rule-attr-operator-select"]'), "contains");
    await page.locator('[data-testid="rule-attr-value-input"]').fill("Test");

    await page.click('[aria-label="Run Query"]');

    await expect(page.locator("#resultsHeading")).toContainText("1 result");
  });

  test("should build a query with Name inclusion and Attribute Value (Number) inclusion rule", async ({ page }) => {
    await expect(page.getByText("No Rules")).toBeVisible();

    await clickButtonByText(page, "Add Rule");
    await page.locator('[data-testid="rule-value-input"]').first().fill("Entity");

    await clickButtonByText(page, "Add Rule");
    await selectChakraSelectOption(page, page.locator('[data-testid="rule-field-select"]').nth(1), "attributes");
    await selectChakraSelectOption(page, page.locator('[data-testid="rule-attr-type-select"]'), "number");
    await selectChakraSelectOption(page, page.locator('[data-testid="rule-attr-operator-select"]'), ">");
    await page.locator('[data-testid="rule-attr-value-input"]').fill("5");

    await page.click('[aria-label="Run Query"]');

    await expect(page.locator("#resultsHeading")).toContainText("1 result");
  });

  test("should build a query with Name inclusion and Attribute Value (Number) less-than rule", async ({ page }) => {
    await expect(page.getByText("No Rules")).toBeVisible();

    await clickButtonByText(page, "Add Rule");
    await page.locator('[data-testid="rule-value-input"]').first().fill("Entity");

    await clickButtonByText(page, "Add Rule");
    await selectChakraSelectOption(page, page.locator('[data-testid="rule-field-select"]').nth(1), "attributes");
    await selectChakraSelectOption(page, page.locator('[data-testid="rule-attr-type-select"]'), "number");
    await selectChakraSelectOption(page, page.locator('[data-testid="rule-attr-operator-select"]'), "<");
    await page.locator('[data-testid="rule-attr-value-input"]').fill("15");

    await page.click('[aria-label="Run Query"]');

    await expect(page.locator("#resultsHeading")).toContainText("1 result");
  });

  test("should build a query with Name inclusion and Attribute Value (Number) equals rule", async ({ page }) => {
    await expect(page.getByText("No Rules")).toBeVisible();

    await clickButtonByText(page, "Add Rule");
    await page.locator('[data-testid="rule-value-input"]').first().fill("Entity");

    await clickButtonByText(page, "Add Rule");
    await selectChakraSelectOption(page, page.locator('[data-testid="rule-field-select"]').nth(1), "attributes");
    await selectChakraSelectOption(page, page.locator('[data-testid="rule-attr-type-select"]'), "number");
    await selectChakraSelectOption(page, page.locator('[data-testid="rule-attr-operator-select"]'), "equals");
    await page.locator('[data-testid="rule-attr-value-input"]').fill("10");

    await page.click('[aria-label="Run Query"]');

    await expect(page.locator("#resultsHeading")).toContainText("1 result");
  });

  test("should build a query with Name inclusion and Attribute Value (Date) after rule", async ({ page }) => {
    await expect(page.getByText("No Rules")).toBeVisible();

    await clickButtonByText(page, "Add Rule");
    await page.locator('[data-testid="rule-value-input"]').first().fill("Entity");

    await clickButtonByText(page, "Add Rule");
    await selectChakraSelectOption(page, page.locator('[data-testid="rule-field-select"]').nth(1), "attributes");
    await selectChakraSelectOption(page, page.locator('[data-testid="rule-attr-type-select"]'), "date");
    await selectChakraSelectOption(page, page.locator('[data-testid="rule-attr-operator-select"]'), ">");
    await page.locator('[data-testid="rule-attr-value-input"]').fill("2000-01-01");

    await page.click('[aria-label="Run Query"]');

    await expect(page.locator("#resultsHeading")).toContainText("1 result");
  });

  test("should build a query with Name inclusion and Attribute Value (Date) before rule", async ({ page }) => {
    await expect(page.getByText("No Rules")).toBeVisible();

    await clickButtonByText(page, "Add Rule");
    await page.locator('[data-testid="rule-value-input"]').first().fill("Entity");

    await clickButtonByText(page, "Add Rule");
    await selectChakraSelectOption(page, page.locator('[data-testid="rule-field-select"]').nth(1), "attributes");
    await selectChakraSelectOption(page, page.locator('[data-testid="rule-attr-type-select"]'), "date");
    await selectChakraSelectOption(page, page.locator('[data-testid="rule-attr-operator-select"]'), "<");
    await page.locator('[data-testid="rule-attr-value-input"]').fill("2030-01-01");

    await page.click('[aria-label="Run Query"]');

    await expect(page.locator("#resultsHeading")).toContainText("1 result");
  });

  test("should build a query with Name inclusion and Attribute Value (Date) equals today rule", async ({ page }) => {
    await expect(page.getByText("No Rules")).toBeVisible();

    await clickButtonByText(page, "Add Rule");
    await page.locator('[data-testid="rule-value-input"]').first().fill("Entity");

    await clickButtonByText(page, "Add Rule");
    await selectChakraSelectOption(page, page.locator('[data-testid="rule-field-select"]').nth(1), "attributes");
    await selectChakraSelectOption(page, page.locator('[data-testid="rule-attr-type-select"]'), "date");
    await selectChakraSelectOption(page, page.locator('[data-testid="rule-attr-operator-select"]'), "equals");
    await page.locator('[data-testid="rule-attr-value-input"]').fill("2026-01-01");

    await page.click('[aria-label="Run Query"]');

    await expect(page.locator("#resultsHeading")).toContainText("1 result");
  });
});
