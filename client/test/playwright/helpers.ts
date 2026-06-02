// Playwright components
import { BrowserContext, Locator, Page } from "@playwright/test";

// Access environment variables
import "dotenv/config";

// Server functions
import { connect, disconnect } from "../../../server/src/connectors/database";
import { setupDatabase, teardownDatabase } from "../../../server/test/helpers";
import { getAuth } from "../../../server/test/helpers";

// Models
import { Entities } from "../../../server/src/models/Entities";
import { Projects } from "../../../server/src/models/Projects";
import { Templates } from "../../../server/src/models/Templates";
import { Workspaces } from "../../../server/src/models/Workspaces";
import { User } from "../../../server/src/models/User";

// Custom types
import { IAttribute, IEntity, IProject, IWorkspace, ResponseData } from "../../../types";

// Utility functions
import dayjs from "dayjs";

// Variables
const TABLE_CONTAINER = ".data-table-scroll-container";

/**
 * Create an Entity for use in testing
 * @param {string} name The name of the Entity to create
 * @param {string} owner The owner of the Entity
 * @param {string} workspace The _id of the Workspace to contain the Entity
 */
export const createTestEntity = async (name: string, owner: string, workspace: string): Promise<void> => {
  await connect();
  const entity: IEntity = {
    archived: false,
    name: name,
    created: dayjs("2023-10-01").toISOString(),
    owner: owner,
    description: "Test Entity",
    relationships: [],
    projects: [],
    attributes: [
      {
        _id: "aTest01",
        archived: false,
        timestamp: dayjs("2023-10-01").toISOString(),
        name: "Test Attribute",
        owner: owner,
        description: "Test Description",
        values: [
          { _id: "vTest00", name: "Test Value 00", type: "text", data: "Test Value" },
          { _id: "vTest01", name: "Test Value 01", type: "number", data: "10" },
          { _id: "vTest02", name: "Test Value 02", type: "date", data: dayjs("2026-01-01").toISOString() },
        ],
      },
    ],
    attachments: [],
    history: [],
  };
  const result: ResponseData<string> = await Entities.create(entity);
  if (!result.success) {
    await disconnect();
    throw new Error("Could not create Entity");
  }

  // Add the Entity to the Workspace
  await Workspaces.addEntity(workspace, result.data);
  await disconnect();
};

/**
 * Create a Project for use in testing
 * @param {string} name The name of the Project to create
 * @param {string} owner The owner of the Project
 * @param {string} workspace The _id of the Workspace to contain the Project
 */
export const createTestProject = async (name: string, owner: string, workspace: string): Promise<void> => {
  await connect();
  const project: IProject = {
    name: name,
    description: "Test Project",
    owner: owner,
    created: dayjs("2023-10-01").toISOString(),
    archived: false,
    collaborators: [],
    entities: [],
    history: [],
  };
  const result: ResponseData<string> = await Projects.create(project);
  if (!result.success) {
    await disconnect();
    throw new Error("Could not create Project");
  }

  // Add the Project to the Workspace
  await Workspaces.addProject(workspace, result.data);
  await disconnect();
};

/**
 * Create a Template for use in testing
 * @param {string} name The name of the Template to create
 * @param {string} owner The owner of the Template
 * @param {string} workspace The _id of the Workspace to contain the Template
 */
export const createTestTemplate = async (name: string, owner: string, workspace: string): Promise<void> => {
  await connect();
  const template: IAttribute = {
    archived: false,
    name: name,
    description: "Test Attribute",
    owner: owner,
    values: [
      { _id: "vTest00", name: "Test Value 00", type: "text", data: "Test Value" },
      { _id: "vTest01", name: "Test Value 01", type: "number", data: "10" },
    ],
  };
  const result: ResponseData<string> = await Templates.create(template);
  if (!result.success) {
    await disconnect();
    throw new Error("Could not create Template");
  }

  // Add the Template to the Workspace
  await Workspaces.addTemplate(workspace, result.data);
  await disconnect();
};

/**
 * Create a new Workspace for a specific test or test suite
 * @param {string} name Workspace name
 * @param {string} owner Workspace owner
 * @return {Promise<string>} Created Workspace identifier
 */
export const createTestWorkspace = async (name: string, owner: string): Promise<string> => {
  await connect();
  const workspace: IWorkspace = {
    name: name,
    description: "Test Workspace",
    owner: owner,
    collaborators: [],
    public: false,
    entities: [],
    projects: [],
    templates: [],
    activity: [],
  };

  const result: ResponseData<string> = await Workspaces.create(workspace);
  if (!result.success) {
    await disconnect();
    throw new Error("Could not create Workspace");
  }

  await disconnect();
  return result.data;
};

/**
 * Create a new user account using the default test user information
 * @param page
 * @return {string} `userId` of the created test user
 */
export const createTestUser = async (context: BrowserContext): Promise<string> => {
  await connect();

  // Setup User
  const auth = await getAuth();
  const ctx = await auth.$context;
  const testUtils = ctx.test;

  const user = testUtils.createUser({
    email: process.env.TEST_USER_EMAIL,
    name: "Test User",
  });
  await testUtils.saveUser(user);

  const cookies = await testUtils.getCookies({
    userId: user.id,
    domain: "127.0.0.1",
  });
  await context.addCookies(cookies);
  await disconnect();

  return user.id;
};

export const getTestUser = async (): Promise<string> => {
  // Get the new user and return `userId`
  await connect();
  const result: ResponseData<string> = await User.getByEmail(process.env.TEST_USER_EMAIL!);
  if (!result.success) {
    await disconnect();
    throw new Error(" Could not locate User: " + result.message);
  }

  await disconnect();
  return result.data;
};

/**
 * Reset function used prior to running tests and after test completion. Clears and resets the database
 * state, creates new user account with standard test credentials
 * @param page
 */
export const resetWorkspace = async (page: Page): Promise<void> => {
  // Setup database once before all tests
  await teardownDatabase();
  await setupDatabase();

  // Clear all session and local storage
  await page.goto("/login");
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  await page.waitForLoadState("networkidle");
};

/**
 * Switch between Workspaces using the `WorkspaceSwitcher` component
 * @param page
 * @param workspace Name of the Workspace to switch to
 */
export const switchWorkspace = async (page: Page, workspace: string): Promise<void> => {
  await page.goto("/");
  await page.locator("#workspaceSwitcherDesktop").waitFor({ state: "visible" });
  await page.click("#workspaceSwitcherDesktop");
  await page.locator(`[role="menuitem"]:has-text("${workspace}")`).first().click();
  await page.waitForLoadState("networkidle");
};

/**
 * Navigate to a section (Entities, Projects, Templates)
 */
export const navigateToSection = async (page: Page, section: "Entities" | "Projects" | "Templates"): Promise<void> => {
  await page.goto("/");
  await page.click(`button:has-text("${section}")`);
  await page.waitForLoadState("networkidle");
};

/**
 * Find and click a table row by text, then click the view button
 */
export const openItemFromTable = async (
  page: Page,
  itemName: string,
  viewButtonLabel: "View Entity" | "View Project" | "View Template",
): Promise<void> => {
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
    throw new Error(`Item "${itemName}" not found in table. Available items: ${allItems.slice(0, 5).join(", ")}...`);
  }
  await textLocator.scrollIntoViewIfNeeded();

  // Find buttons with the correct aria-label
  const count = await buttons.count();

  if (count === 0) {
    throw new Error(`No button with aria-label "${viewButtonLabel}" found in table`);
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
      throw new Error(`Could not find button "${viewButtonLabel}" in row containing "${itemName}"`);
    }

    await closestBtn.scrollIntoViewIfNeeded();
    await closestBtn.click();
  } else {
    await buttons.first().scrollIntoViewIfNeeded();
    await buttons.first().click();
  }
};

/**
 * Save changes and wait for completion
 */
export const saveAndWait = async (page: Page): Promise<void> => {
  await clickButtonByText(page, "Save");
  await page.locator('button:has-text("Done")').waitFor({ state: "visible", timeout: 5000 });
  await clickButtonByText(page, "Done");
  await page.locator('button:has-text("Edit")').waitFor({ state: "visible", timeout: 10000 });
  await page.waitForLoadState("networkidle");
};

/**
 * Select an option from a standard inline dropdown menu
 */
export const selectMenuOption = async (page: Page, triggerSelector: string, optionText: string): Promise<void> => {
  await page.click(triggerSelector);
  await page.locator(`[role="option"]:has-text("${optionText}")`).first().click();
};

/**
 * Select an option from a Chakra v3 Select component
 */
export const selectChakraSelectOption = async (page: Page, trigger: Locator, optionValue: string): Promise<void> => {
  await trigger.click();
  const openContent = page.locator('[data-scope="select"][data-part="content"][data-state="open"]');
  const item = openContent.locator(`[data-scope="select"][data-part="item"][data-value="${optionValue}"]`);
  await item.waitFor({ state: "visible" });
  await item.click();
  await openContent.waitFor({ state: "hidden" });
};

/**
 * Generate a unique name with a short random suffix
 */
export const getUniqueName = (baseName: string): string => {
  const shortId = Math.random().toString(36).substring(2, 6);
  return `${baseName} ${shortId}`;
};

/**
 * Wait for a button to be enabled (not disabled)
 */
export const waitForButtonEnabled = async (page: Page, selector: string, timeout = 10000): Promise<void> => {
  await page.waitForFunction(
    (sel) => {
      const btn = document.querySelector(sel);
      return btn && !btn.hasAttribute("disabled");
    },
    selector,
    { timeout },
  );
};

/**
 * Click a button by text content
 */
export const clickButtonByText = async (page: Page, text: string, timeout = 10000): Promise<void> => {
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
};

/**
 * Wait for and click a button, ensuring it's enabled first
 */
export const clickButtonWhenEnabled = async (page: Page, selector: string, timeout = 10000): Promise<void> => {
  await waitForButtonEnabled(page, selector, timeout);
  await page.click(selector);
};

/**
 * Utility function to open the `AddAttributeDialog` component
 * @param page
 */
export const openAddAttributeDialog = async (page: Page): Promise<void> => {
  await page.click("#addAttributeDialogButton");
  await page.locator("[data-testid='create-attribute-name']").waitFor({ state: "visible", timeout: 10000 });
};

/**
 * Add a new Value to an existing Attribute
 * @param page
 * @param attributeName The name fo the Attribute to add a Value to
 * @param valueName The name of the new Value
 * @param valueData The data contained in the new Value
 */
export const addAttributeValue = async (
  page: Page,
  attributeName: string,
  valueName: string,
  valueData: string,
): Promise<void> => {
  await page.locator("[data-testid='create-attribute-name']").fill(attributeName);
  await page.locator("[data-testid='create-attribute-description']").fill("Attribute description");
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
  await page.locator("#addAttributeDialogButton").waitFor({ state: "visible", timeout: 10000 });
};

/**
 * When on the Project view page, add an Entity to the Project
 * @param {Page} page
 * @param {string} entityName Name of the Entity to add to the Project
 */
export const addEntityToProject = async (page: Page, entityName: string): Promise<void> => {
  await page.click("#addEntityButton");

  // Fill the input directly to trigger the debounced search query rather than clicking the outer container
  await page.locator("#entitySearchSelect input").fill(entityName);

  // Results load after a 300ms debounce plus network round-trip
  await page.locator("[data-testid='search-select-result']").first().waitFor({ state: "visible", timeout: 10000 });
  await page.locator("[data-testid='search-select-result']").filter({ hasText: entityName }).first().click();

  // The Done button enables once an entity is staged
  await page.locator("#addEntityDoneButton:not([disabled])").waitFor({ state: "visible", timeout: 5000 });
  await page.click("#addEntityDoneButton");
  await saveAndWait(page);
};
