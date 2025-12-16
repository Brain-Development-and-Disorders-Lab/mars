import { Page } from "@playwright/test";

const TABLE_CONTAINER = ".data-table-scroll-container";

/**
 * Navigate to a section (Entities, Projects, Templates)
 */
export async function navigateToSection(
  page: Page,
  section: "Entities" | "Projects" | "Templates",
): Promise<void> {
  await page.goto("/");
  await page.click(`button:has-text("${section}")`);
  await page.waitForLoadState("domcontentloaded");
}

/**
 * Find and click a table row by text, then click the view button
 */
export async function openItemFromTable(
  page: Page,
  itemName: string,
  viewButtonLabel: "View Entity" | "View Project" | "View Template",
): Promise<void> {
  const table = page.locator(TABLE_CONTAINER);
  const row = table
    .locator(`text=${itemName}`)
    .locator("..")
    .locator("..")
    .first();
  await row.locator(`button[aria-label="${viewButtonLabel}"]`).first().click();
}

/**
 * Fill an MDEditor textarea (which is nested inside a wrapper)
 */
export async function fillMDEditor(
  page: Page,
  selector: string,
  value: string,
): Promise<void> {
  const textarea = page.locator(`${selector} textarea`);
  await textarea.waitFor({ state: "visible", timeout: 5000 });
  await textarea.click();
  await textarea.clear();
  await textarea.fill(value);
}

/**
 * Save changes and wait for completion
 * Handles the save modal and waits for edit mode to exit
 */
export async function saveAndWait(page: Page): Promise<void> {
  await page.click('button:has-text("Save")');
  await page
    .locator('button:has-text("Done")')
    .waitFor({ state: "visible", timeout: 5000 });
  await page.click('button:has-text("Done")');
  await page
    .locator('button:has-text("Edit")')
    .waitFor({ state: "visible", timeout: 10000 });
}

/**
 * Select an option from a dropdown
 */
export async function selectDropdownOption(
  page: Page,
  triggerSelector: string,
  optionText: string,
): Promise<void> {
  await page.click(triggerSelector);
  await page.click(`[role="option"]:has-text("${optionText}")`);
}

/**
 * Generate a unique name with a short random suffix
 */
export function getUniqueName(baseName: string): string {
  const shortId = Math.random().toString(36).substring(2, 6);
  return `${baseName} ${shortId}`;
}

/**
 * Wait for a button to be enabled (not disabled)
 */
export async function waitForButtonEnabled(
  page: Page,
  selector: string,
  timeout = 10000,
): Promise<void> {
  await page.waitForFunction(
    (sel) => {
      const btn = document.querySelector(sel);
      return btn && !btn.hasAttribute("disabled");
    },
    selector,
    { timeout },
  );
}
