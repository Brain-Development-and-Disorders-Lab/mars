// Playwright components
import { Page } from "@playwright/test";

// Access environment variables
import "dotenv/config";

// Locator variables
const TABLE_CONTAINER = ".data-table-scroll-container";

// Server functions
import { setupDatabase, teardownDatabase } from "../../../server/test/util";

/**
 * Perform login using information stored in environment variables
 * @param page
 */
export async function performLogin(page: Page): Promise<void> {
  await page.goto("/login");
  await page.locator("#userEmailInput").fill(process.env.TEST_USER_EMAIL);
  await page.locator("#userPasswordInput").fill(process.env.TEST_USER_PASSWORD);
  await page.locator("#userLoginButton").click();
  await page.waitForSelector("#workspaceSwitcherDesktop");
}

/**
 * Create a new Workspace for a specific test or test suite
 * @param page
 */
export async function setupEnvironment(
  page: Page,
  testName: string,
): Promise<void> {
  await page.goto("/create/workspace");
  await page
    .locator("[data-testid='create-workspace-name']")
    .waitFor({ state: "visible", timeout: 10000 });
  await page
    .locator("[data-testid='create-workspace-name']")
    .fill(`Test Workspace - ${testName}`);
  await page
    .locator("[data-testid='create-workspace-description'] textarea")
    .fill(`Test Workspace for test: ${testName}`);
  await page.click("[data-testid='create-workspace-button']");
  await page.waitForURL("/", { timeout: 10000 });
}

/**
 * Reset function used prior to running tests and after test completion. Clears and resets the database
 * state, creates new user account with standard test credentials
 * @param page
 */
export async function resetEnvironment(page: Page): Promise<void> {
  // Setup database once before all tests
  await teardownDatabase();
  await setupDatabase();

  // Access the baseURL from the config file if needed
  await page.goto("/login");
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  await page.waitForLoadState("domcontentloaded");

  // Create user account
  await page
    .locator("#createAccountButton")
    .waitFor({ state: "visible", timeout: 10000 });
  await page.click("#createAccountButton");
  await page.waitForLoadState("domcontentloaded");

  // Populate user information (use environment variables for specific details)
  await page.locator("#userFirstNameInput").fill("User");
  await page.locator("#userLastNameInput").fill("Test");
  await page
    .locator("#userEmailInput")
    .fill(process.env.TEST_USER_EMAIL || "test@test.com");
  await selectDropdownOption(
    page,
    '[data-testid="affiliation-select-trigger"]',
    "No Affiliation",
  );
  await page
    .locator("#userPasswordInputInitial")
    .fill(process.env.TEST_USER_PASSWORD || "test_password123");
  await page
    .locator("#userPasswordInputConfirm")
    .fill(process.env.TEST_USER_PASSWORD || "test_password123");

  // Finalize account creation
  await page.locator("#createAccountButton").click();

  // Create a Workspace
  await page.locator("#modalWorkspaceName").fill("Test Workspace");
  await page.locator("#modalWorkspaceCreateButton").click();
}

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
  await table.waitFor({ state: "visible", timeout: 5000 });

  // Wait for table to be populated - check that at least one view button exists
  const buttons = table.locator(`button[aria-label="${viewButtonLabel}"]`);
  await buttons.first().waitFor({ state: "visible", timeout: 5000 });

  // Wait for network to be idle to ensure all data is loaded
  await page.waitForLoadState("networkidle");

  // Wait for the item name to appear
  const textLocator = table.locator(`text=${itemName}`).first();
  try {
    await textLocator.waitFor({ state: "visible", timeout: 5000 });
  } catch {
    // If item not found, provide helpful error message
    const allItems = await table.locator("text").allTextContents();
    throw new Error(
      `Item "${itemName}" not found in table. Available items: ${allItems.slice(0, 5).join(", ")}...`,
    );
  }
  await textLocator.scrollIntoViewIfNeeded();

  // Find buttons with the correct aria-label
  const count = await buttons.count();

  if (count === 0) {
    throw new Error(
      `No button with aria-label "${viewButtonLabel}" found in table`,
    );
  }

  // If multiple buttons, find the one closest to the text by Y coordinate
  if (count > 1) {
    const textBox = await textLocator.boundingBox();
    if (!textBox) {
      throw new Error(`Text "${itemName}" not found or not visible`);
    }

    let closestBtn = null;
    let minDistance = Infinity;

    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const btnBox = await btn.boundingBox().catch(() => null);
      if (btnBox) {
        const distance = Math.abs(textBox.y - btnBox.y);
        if (distance < 50 && distance < minDistance) {
          minDistance = distance;
          closestBtn = btn;
        }
      }
    }

    if (!closestBtn) {
      throw new Error(
        `Could not find button "${viewButtonLabel}" in row containing "${itemName}"`,
      );
    }

    await closestBtn.scrollIntoViewIfNeeded();
    await closestBtn.click();
  } else {
    await buttons.first().scrollIntoViewIfNeeded();
    await buttons.first().click();
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
  await clickButtonByText(page, "Save");
  await page
    .locator('button:has-text("Done")')
    .waitFor({ state: "visible", timeout: 5000 });
  await clickButtonByText(page, "Done");
  await page
    .locator('button:has-text("Edit")')
    .waitFor({ state: "visible", timeout: 10000 });
  await page.waitForLoadState("networkidle");
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

/**
 * Click a button by text content
 */
export async function clickButtonByText(
  page: Page,
  text: string,
  timeout = 10000,
): Promise<void> {
  let button = page.locator(`button:has-text("${text}")`);
  const count = await button.count();

  if (count > 1) {
    // If multiple matches, find the first enabled button
    let enabledButton = null;
    for (let i = 0; i < count; i++) {
      const btn = button.nth(i);
      const isDisabled = await btn.getAttribute("disabled");
      if (!isDisabled) {
        enabledButton = btn;
        break;
      }
    }
    button = enabledButton || button.first();
  }

  await button.waitFor({ state: "visible", timeout });
  await button.click();
}

/**
 * Wait for and click a button, ensuring it's enabled first
 */
export async function clickButtonWhenEnabled(
  page: Page,
  selector: string,
  timeout = 10000,
): Promise<void> {
  await waitForButtonEnabled(page, selector, timeout);
  await page.click(selector);
}
