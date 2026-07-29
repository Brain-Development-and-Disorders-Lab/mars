// Playwright imports
import { BrowserContext, Locator, Page, expect, test as base } from "@playwright/test";

// Test helper functions
import { createTestUser, createTestWorkspace, getUniqueName } from "./global.helpers";

// Server models, used to seed a Workspace Collaborator directly
import { DEFAULT_WORKSPACE_PERMISSIONS } from "../../../../server/src/models/Admin";

// Custom types
import { ClientPath } from "../../../../types";

/**
 * Extend the `test` context to share nothing with the Workspace Owner's context
 */
export const test = base.extend<{ collaboratorPage: Page }>({
  collaboratorPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

/**
 * Create an Owner and a Collaborator in separate browser sessions, sharing a fresh Workspace
 * @param {BrowserContext} ownerContext Context for the Workspace owner
 * @param {Page} collaboratorPage Page instance associated with the Collaborator
 * @param {string} baseWorkspaceName Initial Workspace name to base new Workspace name from
 * @return {{ owner: string; collaborator: string; workspaceId: string; }}
 */
export const setupDefaultPermissions = async (
  ownerContext: BrowserContext,
  collaboratorPage: Page,
  baseWorkspaceName: string,
): Promise<{
  owner: string;
  collaborator: string;
  workspaceId: string;
}> => {
  const owner = await createTestUser(ownerContext);

  const collaboratorEmail = `${getUniqueName("collaborator").replace(/\s+/g, "-").toLowerCase()}@test.com`;
  const collaborator = await createTestUser(collaboratorPage.context(), {
    email: collaboratorEmail,
    name: "Test Collaborator",
  });

  const workspaceName = getUniqueName(baseWorkspaceName);
  const workspaceId = await createTestWorkspace(workspaceName, owner, [
    { _id: collaborator, permissions: DEFAULT_WORKSPACE_PERMISSIONS },
  ]);

  // A freshly created User has no other Workspace to be active
  await collaboratorPage.goto("/");
  await collaboratorPage.waitForLoadState("networkidle");

  return { owner, collaborator, workspaceId };
};

/**
 * Open a Workspace's management page directly
 * @param {Page} page Current test Page
 * @param {string} workspaceId Identifier of the Workspace to open the management page
 */
export const openManageWorkspace = async (page: Page, workspaceId: string): Promise<void> => {
  await page.goto(`/workspaces/${workspaceId}`);
  await page.waitForLoadState("networkidle");
};

/**
 * Toggle one of the Collaborator's Workspace permission switches by its label
 * @param {Page} page Current test Page
 * @param {string} switchLabel Text label of the `Switch` component to toggle
 */
export const toggleCollaboratorPermission = async (page: Page, switchLabel: string): Promise<void> => {
  await page.getByRole("button", { name: "Manage permissions" }).click();
  await page.waitForLoadState("networkidle");
  await page.getByText(switchLabel, { exact: true }).click();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByText("Permissions updated")).toBeVisible();

  // The Dialog only updates local state, so the change must be persisted via the Workspace `Save` button
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL("/");
};

/**
 * Access point state gated by an enabled or disabled form control
 * @param {string} name Path name
 * @param {string} path Exact path
 * @param {(page: Page) => Locator} locator Playwright `Locator` to establish gate form control
 * @return {ClientPath}
 */
export const clientPathDisabled = (name: string, path: string, locator: (page: Page) => Locator): ClientPath => {
  return {
    name: name,
    verify: async (page, granted) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      if (granted) {
        await expect(locator(page)).toBeEnabled();
      } else {
        await expect(locator(page)).toBeDisabled();
      }
    },
  };
};

/**
 * Access point state gated by an visible form control
 * @param {string} name Path name
 * @param {string} path Exact path
 * @param {(page: Page) => Locator} locator Playwright `Locator` to establish gate form control
 * @return {ClientPath}
 */
export const clientPathVisible = (name: string, path: string, locator: (page: Page) => Locator): ClientPath => {
  return {
    name: name,
    verify: async (page, granted) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      if (granted) {
        await expect(locator(page)).toBeVisible();
      } else {
        await expect(locator(page)).toBeHidden();
      }
    },
  };
};

/**
 * The "Archive" item inside a view page's "Actions" menu, shared shape across Entities, Projects, and Templates
 * @param {string} name Path name
 * @param {string} path Exact path
 * @return {ClientPath}
 */
export const clientPathArchive = (name: string, path: string): ClientPath => {
  return {
    name: name,
    verify: async (page, granted) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "Actions" }).click();
      const archiveItem = page.getByRole("menuitem", { name: "Archive" });
      if (granted) {
        await expect(archiveItem).toBeEnabled();
      } else {
        await expect(archiveItem).toBeDisabled();
      }
      await page.keyboard.press("Escape");
    },
  };
};

/**
 * Verify a set of `ClientPath`s and evaluate permissions status
 * @param {Page} page Current test Page
 * @param {ClientPath[]} paths Collection of `ClientPath`s to verify
 * @param {boolean} granted State of whether access should be granted or not
 */
export const verifyClientPaths = async (page: Page, paths: ClientPath[], granted: boolean): Promise<void> => {
  for (const path of paths) {
    await path.verify(page, granted);
  }
};
