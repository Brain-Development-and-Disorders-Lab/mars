// Playwright imports
import { test, expect } from "@playwright/test";

// Test helper functions
import {
  navigateToSection,
  openItemFromTable,
  saveAndWait,
  addAttributeValue,
  openAddAttributeDialog,
  createTestTemplate,
  createTestEntity,
  createTestWorkspace,
  createTestUser,
  switchWorkspace,
} from "../helpers/global.helpers";

test.describe("Template", () => {
  test.describe("Create", () => {
    test.beforeEach(async ({ context, page }) => {
      // Create User
      const user = await createTestUser(context);

      // Setup Workspace and Templates
      const workspace = await createTestWorkspace("Template-1", user);
      await createTestTemplate("1-Template-Create", user, workspace);

      // Navigate for tests
      await page.goto("/");
      await switchWorkspace(page, "Template-1");
    });

    test("should create a Template and appear in the list", async ({ page }) => {
      await navigateToSection(page, "Templates");

      const table = page.getByTestId("data-table-scroll-container");
      await table.waitFor({ state: "visible", timeout: 5000 });
      await expect(table.locator(`text=1-Template-Create`)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Modify Entity", () => {
    test.beforeEach(async ({ context, page }) => {
      // Create User
      const user = await createTestUser(context);

      // Setup Workspace and Templates
      const workspace = await createTestWorkspace("Template-5", user);
      await createTestEntity("1-Attribute-Text-Entity", user, workspace);
      await createTestEntity("2-Attribute-Multi-Entity", user, workspace);
      await createTestEntity("3-Attribute-Delete-Entity", user, workspace);

      // Navigate for tests
      await page.goto("/");
      await switchWorkspace(page, "Template-5");
    });

    test("should add a text Attribute to an Entity and persist after reload", async ({ page }) => {
      await navigateToSection(page, "Entities");
      await openItemFromTable(page, "1-Attribute-Text-Entity", "View Entity");

      await page.click("#editEntityButton");
      await openAddAttributeDialog(page);
      await addAttributeValue(page, "Color", "Hue", "Blue");
      await expect(page.locator("text=Color")).toBeVisible({ timeout: 5000 });

      await saveAndWait(page);
      await page.locator("text=Updated Successfully").waitFor({ state: "visible", timeout: 10000 });

      // Attribute values are shown in a dialog, so only the name is visible inline after reload
      await page.reload();
      await page.waitForLoadState("networkidle");
      await expect(page.locator("text=Color")).toBeVisible({ timeout: 10000 });
      await expect(page.locator("text=No Attributes")).not.toBeVisible({ timeout: 5000 });
    });

    test("should add an Attribute with multiple values", async ({ page }) => {
      await navigateToSection(page, "Entities");
      await openItemFromTable(page, "2-Attribute-Multi-Entity", "View Entity");

      await page.click("#editEntityButton");
      await openAddAttributeDialog(page);

      await page.locator("[data-testid='create-attribute-name']").fill("Measurements");
      await page.locator("[data-testid='create-attribute-description']").fill("Multiple measurement values");

      await page.click("#addValueRowButton");
      await page.locator('input[placeholder="Enter name"]').nth(0).fill("Width");
      await page.locator('input[placeholder="Enter text"]').nth(0).fill("10cm");

      await page.click("#addValueRowButton");
      await page.locator('input[placeholder="Enter name"]').nth(1).fill("Height");
      await page.locator('input[placeholder="Enter text"]').nth(1).fill("20cm");

      await page.waitForFunction(
        () => {
          const btn = document.querySelector('[data-testid="save-add-attribute-button"]') as HTMLButtonElement;
          return btn && !btn.disabled;
        },
        { timeout: 5000 },
      );
      await page.locator("[data-testid='save-add-attribute-button']").click();
      await page.locator("#addAttributeDialogButton").waitFor({ state: "visible", timeout: 10000 });

      await saveAndWait(page);
      await page.locator("text=Updated Successfully").waitFor({ state: "visible", timeout: 10000 });

      // Attribute values are shown in a dialog, so only the name is visible inline after reload
      await page.reload();
      await page.waitForLoadState("networkidle");
      await expect(page.locator("text=Measurements")).toBeVisible({ timeout: 10000 });
      await expect(page.locator("text=No Attributes")).not.toBeVisible({ timeout: 5000 });
    });

    test("should delete an Attribute from an Entity and confirm removal after reload", async ({ page }) => {
      await navigateToSection(page, "Entities");
      await openItemFromTable(page, "3-Attribute-Delete-Entity", "View Entity");
      await expect(page.locator("text=Test Attribute")).toBeVisible({ timeout: 10000 });

      await page.click("#editEntityButton");
      await page.locator('button[aria-label="Delete Attribute"]').waitFor({ state: "visible", timeout: 10000 });
      await page.locator('button[aria-label="Delete Attribute"]').click();
      await saveAndWait(page);

      await expect(page.locator("text=No Attributes")).toBeVisible({ timeout: 10000 });
      await page.reload();
      await expect(page.locator("text=No Attributes")).toBeVisible({ timeout: 10000 });
    });
  });
});
