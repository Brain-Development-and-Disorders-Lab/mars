// Playwright imports
import { test, expect, Page } from "@playwright/test";

// Test helper functions
import {
  navigateToSection,
  openItemFromTable,
  fillMDEditor,
  clickButtonByText,
  saveAndWait,
  getUniqueName,
  performLogin,
  setupEnvironment,
  createTestTemplate,
  createTestEntity,
} from "../helpers";

async function openAddAttributeModal(page: Page): Promise<void> {
  await page.click("#addAttributeModalButton");
  await page.locator("[data-testid='create-attribute-name']").waitFor({ state: "visible", timeout: 10000 });
}

async function fillAndSaveAttribute(
  page: Page,
  attributeName: string,
  valueName: string,
  valueData: string,
): Promise<void> {
  await page.locator("[data-testid='create-attribute-name'] input").fill(attributeName);
  await page.locator("[data-testid='create-attribute-description'] textarea").fill("Attribute description");
  await page.click("#addValueRowButton");
  await page.locator('input[placeholder="Enter name"]').fill(valueName);
  await page.locator('input[placeholder="Enter text"]').fill(valueData);
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('[data-testid="save-add-attribute-button"]') as HTMLButtonElement;
      return btn && !btn.disabled;
    },
    { timeout: 5000 },
  );
  await page.locator("[data-testid='save-add-attribute-button']").click();
  await page.locator("#addAttributeModalButton").waitFor({ state: "visible", timeout: 10000 });
}

test.describe("Template", () => {
  test.describe("Create", () => {
    test.beforeEach(async ({ page }) => {
      test.setTimeout(60000);
      await performLogin(page);
      await setupEnvironment(page, "template-create");
      await page.goto("/");
    });

    test("should create a Template and appear in the list", async ({ page }) => {
      const templateName = getUniqueName("New Template");
      await createTestTemplate(page, templateName);
      await navigateToSection(page, "Templates");

      const table = page.locator(".data-table-scroll-container");
      await table.waitFor({ state: "visible", timeout: 5000 });
      await expect(table.locator(`text=${templateName}`)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Edit", () => {
    test.beforeEach(async ({ page }) => {
      test.setTimeout(60000);
      await performLogin(page);
      await setupEnvironment(page, "template-edit");
      await page.goto("/");
    });

    test("allows editing the Template name and description", async ({ page }) => {
      const templateName = getUniqueName("Edit Template");
      await createTestTemplate(page, templateName);
      await navigateToSection(page, "Templates");
      await openItemFromTable(page, templateName, "View Template");

      await page.click("#editTemplateButton");
      await page.locator("#attributeNameInput").fill(`${templateName} Updated`);
      await fillMDEditor(page, "#attributeDescriptionInput", "Updated description");
      await saveAndWait(page);
      await expect(
        page.locator(".chakra-toast__root").filter({ hasText: "Updated Successfully" }).first(),
      ).toBeVisible();

      await page.reload();
      await expect(page.locator("#attributeNameInput")).toHaveValue(`${templateName} Updated`);
    });
  });

  test.describe("Export", () => {
    test.beforeEach(async ({ page }) => {
      test.setTimeout(60000);
      await performLogin(page);
      await setupEnvironment(page, "template-export");
      await page.goto("/");
    });

    test("exports the Template as a JSON file", async ({ page }) => {
      const templateName = getUniqueName("Export Template");
      await createTestTemplate(page, templateName);
      await navigateToSection(page, "Templates");
      await openItemFromTable(page, templateName, "View Template");

      await page.click('[data-testid="templateActionsButton"]');
      const downloadPromise = page.waitForEvent("download");
      await page.click('[data-value="export"]');
      await downloadPromise;
      await page
        .locator(".chakra-toast__root")
        .filter({ hasText: "Generated JSON file" })
        .waitFor({ state: "visible", timeout: 10000 });
    });
  });

  test.describe("Archive", () => {
    test.beforeEach(async ({ page }) => {
      test.setTimeout(60000);
      await performLogin(page);
      await setupEnvironment(page, "template-archive");
      await page.goto("/");
    });

    test("archives and restores a Template", async ({ page }) => {
      const templateName = getUniqueName("Archive Template");
      await createTestTemplate(page, templateName);
      await navigateToSection(page, "Templates");
      await openItemFromTable(page, templateName, "View Template");

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
    test.beforeEach(async ({ page }) => {
      test.setTimeout(60000);
      await performLogin(page);
      await setupEnvironment(page, "template-entity-attrs");
      await page.goto("/");
    });

    test("should add a text Attribute to an Entity and persist after reload", async ({ page }) => {
      const entityName = getUniqueName("Attr Text Entity");
      await createTestEntity(page, entityName);
      await navigateToSection(page, "Entities");
      await openItemFromTable(page, entityName, "View Entity");

      await page.click("#editEntityButton");
      await openAddAttributeModal(page);
      await fillAndSaveAttribute(page, "Color", "Hue", "Blue");
      await expect(page.locator("text=Color")).toBeVisible({ timeout: 5000 });

      await saveAndWait(page);
      await page.locator("text=Updated Successfully").waitFor({ state: "visible", timeout: 10000 });

      // Attribute values are shown in a modal, so only the name is visible inline after reload
      await page.reload();
      await page.waitForLoadState("networkidle");
      await expect(page.locator("text=Color")).toBeVisible({ timeout: 10000 });
      await expect(page.locator("text=No Attributes")).not.toBeVisible({ timeout: 5000 });
    });

    test("should add an Attribute with multiple values", async ({ page }) => {
      const entityName = getUniqueName("Attr Multi Entity");
      await createTestEntity(page, entityName);
      await navigateToSection(page, "Entities");
      await openItemFromTable(page, entityName, "View Entity");

      await page.click("#editEntityButton");
      await openAddAttributeModal(page);

      await page.locator("[data-testid='create-attribute-name'] input").fill("Measurements");
      await page.locator("[data-testid='create-attribute-description'] textarea").fill("Multiple measurement values");

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
      await page.locator("#addAttributeModalButton").waitFor({ state: "visible", timeout: 10000 });

      await saveAndWait(page);
      await page.locator("text=Updated Successfully").waitFor({ state: "visible", timeout: 10000 });

      // Attribute values are shown in a modal, so only the name is visible inline after reload
      await page.reload();
      await page.waitForLoadState("networkidle");
      await expect(page.locator("text=Measurements")).toBeVisible({ timeout: 10000 });
      await expect(page.locator("text=No Attributes")).not.toBeVisible({ timeout: 5000 });
    });

    test("should delete an Attribute from an Entity and confirm removal after reload", async ({ page }) => {
      const entityName = getUniqueName("Attr Delete Entity");
      await createTestEntity(page, entityName);
      await navigateToSection(page, "Entities");
      await openItemFromTable(page, entityName, "View Entity");

      await page.click("#editEntityButton");
      await openAddAttributeModal(page);
      await fillAndSaveAttribute(page, "Temp Attribute", "Key", "Value");
      await saveAndWait(page);
      await page.locator("text=Updated Successfully").waitFor({ state: "visible", timeout: 10000 });

      await page.reload();
      await page.waitForLoadState("networkidle");
      await expect(page.locator("text=Temp Attribute")).toBeVisible({ timeout: 10000 });

      await page.click("#editEntityButton");
      await page.locator('button[aria-label="Delete Attribute"]').waitFor({ state: "visible", timeout: 10000 });
      await page.locator('button[aria-label="Delete Attribute"]').click();
      await clickButtonByText(page, "Save");
      await clickButtonByText(page, "Done");

      await expect(page.locator("text=No Attributes")).toBeVisible({ timeout: 10000 });
      await page.reload();
      await expect(page.locator("text=No Attributes")).toBeVisible({ timeout: 10000 });
    });
  });
});
