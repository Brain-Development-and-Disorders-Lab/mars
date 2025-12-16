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
 * The DataTable uses Flex components for rows, so we find the button
 * by checking which row contains both the text and the button
 */
export async function openItemFromTable(
  page: Page,
  itemName: string,
  viewButtonLabel: "View Entity" | "View Project" | "View Template",
): Promise<void> {
  const table = page.locator(TABLE_CONTAINER);

  // Wait for the table to be visible
  await table.waitFor({ state: "visible", timeout: 10000 });

  // Find the text first to ensure it's loaded
  const textLocator = table.locator(`text=${itemName}`).first();
  await textLocator.waitFor({ state: "visible", timeout: 10000 });

  // Scroll the text into view to ensure it's visible
  await textLocator.scrollIntoViewIfNeeded();

  // Get all buttons with the correct aria-label
  const allButtons = table.locator(`button[aria-label="${viewButtonLabel}"]`);
  const buttonCount = await allButtons.count();

  if (buttonCount === 0) {
    throw new Error(
      `No button with aria-label "${viewButtonLabel}" found in table`,
    );
  }

  if (buttonCount === 1) {
    // Only one button, must be it
    await allButtons.first().waitFor({ state: "visible", timeout: 10000 });
    await allButtons.first().scrollIntoViewIfNeeded();
    await allButtons.first().click();
    return;
  }

  // Get the bounding box of the text
  const textBox = await textLocator.boundingBox();
  if (!textBox) {
    throw new Error(`Text "${itemName}" not found or not visible`);
  }

  // Find the button closest to the text
  let closestButton = null;
  let minYDistance = Infinity;

  for (let i = 0; i < buttonCount; i++) {
    const btn = allButtons.nth(i);
    const btnBox = await btn.boundingBox().catch(() => null);

    if (btnBox) {
      const yDistance = Math.abs(textBox.y - btnBox.y);

      if (yDistance < 50 && yDistance < minYDistance) {
        minYDistance = yDistance;
        closestButton = btn;
      }
    }
  }

  if (closestButton) {
    await closestButton.waitFor({ state: "visible", timeout: 10000 });
    await closestButton.scrollIntoViewIfNeeded();
    await closestButton.click();
  } else {
    throw new Error(
      `Could not find button "${viewButtonLabel}" in row containing "${itemName}"`,
    );
  }
}

/**
 * Fill an MDEditor textarea
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
  await page
    .locator(`[role="option"]:has-text("${optionText}")`)
    .first()
    .click();
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
