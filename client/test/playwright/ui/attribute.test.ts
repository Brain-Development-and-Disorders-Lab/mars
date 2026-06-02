// Playwright imports
import { test, expect } from "@playwright/test";

// Test helper functions
import {
  navigateToSection,
  openItemFromTable,
  clickButtonByText,
  saveAndWait,
  addAttributeValue,
  openAddAttributeDialog,
  createTestTemplate,
  createTestEntity,
  createTestWorkspace,
  createTestUser,
  switchWorkspace,
} from "../helpers";

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

      const table = page.locator(".data-table-scroll-container");
      await table.waitFor({ state: "visible", timeout: 5000 });
      await expect(table.locator(`text=1-Template-Create`)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Edit", () => {
    test.beforeEach(async ({ context, page }) => {
      // Create User
      const user = await createTestUser(context);

      // Setup Workspace and Templates
      const workspace = await createTestWorkspace("Template-2", user);
      await createTestTemplate("1-Template-Edit", user, workspace);

      // Navigate for tests
      await page.goto("/");
      await switchWorkspace(page, "Template-2");
    });

    test("allows editing the Template name and description", async ({ page }) => {
      await navigateToSection(page, "Templates");
      await openItemFromTable(page, "1-Template-Edit", "View Template");

      await page.click("#editTemplateButton");
      await page.locator("#attributeNameInput").fill(`1-Template-Edit-Updated`);
      await page.locator("#attributeDescriptionInput").fill("Updated description");
      await saveAndWait(page);
      await expect(
        page.locator(".chakra-toast__root").filter({ hasText: "Updated Successfully" }).first(),
      ).toBeVisible();

      await page.reload();
      await expect(page.locator("#attributeNameInput")).toHaveValue(`1-Template-Edit-Updated`);
    });
  });

  test.describe("Export", () => {
    test.beforeEach(async ({ context, page }) => {
      // Create User
      const user = await createTestUser(context);

      // Setup Workspace and Templates
      const workspace = await createTestWorkspace("Template-3", user);
      await createTestTemplate("1-Template-Export", user, workspace);

      // Navigate for tests
      await page.goto("/");
      await switchWorkspace(page, "Template-3");
    });

    test("exports the Template as a JSON file", async ({ page }) => {
      await navigateToSection(page, "Templates");
      await openItemFromTable(page, "1-Template-Export", "View Template");

      await page.click('[data-testid="templateActionsButton"]');
      await page.click('[data-value="export"]');
      await page.locator('button:has-text("Download")').waitFor({ state: "visible", timeout: 10000 });
      const downloadPromise = page.waitForEvent("download");
      await page.locator('button:has-text("Download")').click();
      await downloadPromise;
    });
  });

  test.describe("Archive", () => {
    test.beforeEach(async ({ context, page }) => {
      // Create User
      const user = await createTestUser(context);

      // Setup Workspace and Templates
      const workspace = await createTestWorkspace("Templates-4", user);
      await createTestTemplate("1-Template-Archive", user, workspace);

      // Navigate for tests
      await page.goto("/");
      await switchWorkspace(page, "Templates-4");
    });

    test("archives and restores a Template", async ({ page }) => {
      await navigateToSection(page, "Templates");
      await openItemFromTable(page, "1-Template-Archive", "View Template");

      await page.click('[data-testid="templateActionsButton"]');
      await page.click('[data-value="archive"]');
      await clickButtonByText(page, "Confirm");
      await expect(page.locator(".chakra-toast__root").filter({ hasText: "Archived Successfully" })).toBeVisible();

      await page.click("#restoreTemplateButton");
      await expect(
        page.locator(".chakra-toast__root").filter({ hasText: "Restored Template successfully" }),
      ).toBeVisible();

      await expect(page.locator("#editTemplateButton")).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Entity Attributes", () => {
    test.beforeEach(async ({ context, page }) => {
      // Create User
      const user = await createTestUser(context);

      // Setup Workspace and Templates
      const workspace = await createTestWorkspace("Templates-5", user);
      await createTestEntity("1-Attribute-Text-Entity", user, workspace);
      await createTestEntity("2-Attribute-Multi-Entity", user, workspace);
      await createTestEntity("3-Attribute-Delete-Entity", user, workspace);

      // Navigate for tests
      await page.goto("/");
      await switchWorkspace(page, "Templates-5");
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
