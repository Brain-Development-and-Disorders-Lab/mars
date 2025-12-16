import { test as base, Page } from "@playwright/test";
import { createTestWorkspace } from "../../../server/test/util";

/**
 * Suppress console errors and unhandled rejections for known non-critical errors
 * This function is injected into the browser context, so patterns must be defined inline
 */
function suppressNonCriticalErrors() {
  const ignoredPatterns = [
    /AbortError/i,
    /Request aborted/i,
    /net::ERR_ABORTED/i,
    /Failed to fetch/i,
    /NetworkError/i,
    /The operation was aborted/i,
    /Load failed/i,
    /ResizeObserver loop/i,
  ];

  const originalConsoleError = window.console.error;
  window.console.error = (...args: unknown[]) => {
    const message = args.map((arg) => String(arg)).join(" ");
    if (!ignoredPatterns.some((pattern) => pattern.test(message))) {
      originalConsoleError.apply(window.console, args);
    }
  };

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason?.message || String(event.reason || "");
    if (ignoredPatterns.some((pattern) => pattern.test(reason))) {
      event.preventDefault();
    }
  });
}

/**
 * Handle user setup if needed (should be rare since seed creates full user)
 */
async function handleUserSetup(page: Page): Promise<void> {
  const setupForm = page.locator("#userFirstNameInput");
  const isSetupVisible = await setupForm.isVisible().catch(() => false);

  if (!isSetupVisible) return;

  await setupForm.fill("Test");
  await page.locator("#userLastNameInput").fill("User");
  await page.locator("#userEmailInput").fill("test@example.com");
  await page.click('[data-testid="affiliation-select-trigger"]');
  await page.click('[role="option"]:has-text("No Affiliation")');
  await page.locator('button:has-text("Complete Setup")').click();
  await page.waitForURL(
    (url) => url.pathname !== "/setup" && url.pathname !== "/login",
    { timeout: 20000 },
  );
  await page.waitForLoadState("domcontentloaded");
}

// Extend base test with custom fixtures
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    // Suppress non-critical errors
    await page.addInitScript(suppressNonCriticalErrors);

    // Clear storage and perform login
    await page.goto("/");
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });

    await page.waitForLoadState("domcontentloaded");
    await page
      .locator("#orcidLoginButton")
      .waitFor({ state: "visible", timeout: 10000 });
    await page.click("#orcidLoginButton");

    // Wait for navigation away from login
    await page.waitForURL((url: URL) => url.pathname !== "/login", {
      timeout: 20000,
    });
    await page.waitForLoadState("domcontentloaded");

    // Handle setup if needed
    await handleUserSetup(page);

    // Wait for dashboard to be ready
    await page
      .locator("#navSearchButtonDesktop, #navProjectsButtonDesktop")
      .first()
      .waitFor({
        state: "visible",
        timeout: 15000,
      });

    await use(page);

    // Cleanup
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
  },
});

/**
 * Switch to a workspace by name via the UI
 */
async function switchToWorkspace(
  page: Page,
  workspaceName: string,
): Promise<void> {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");

  const workspaceSwitcher = page
    .locator("#workspaceSwitcherDesktop, #workspaceSwitcherMobile")
    .first();
  await workspaceSwitcher.waitFor({ state: "visible", timeout: 10000 });
  await workspaceSwitcher.locator("button").first().click();
  await page.waitForTimeout(500);

  const workspaceOption = page
    .locator(`[role="menuitem"]:has-text("${workspaceName}")`)
    .first();
  await workspaceOption.waitFor({ state: "visible", timeout: 5000 });
  await workspaceOption.click();

  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2000);
}

/**
 * Determine workspace name based on test suite name content
 * Uses plural, concise names to avoid truncation in UI
 */
function getWorkspaceNameForSuite(suiteName: string): string {
  const normalized = suiteName.toLowerCase();

  if (normalized.includes("entity") || normalized.includes("entities")) {
    return "Entities Workspace";
  }
  if (normalized.includes("project") || normalized.includes("projects")) {
    return "Projects Workspace";
  }
  if (normalized.includes("template") || normalized.includes("templates")) {
    return "Templates Workspace";
  }
  if (normalized.includes("query") || normalized.includes("search")) {
    return "Query Workspace";
  }
  if (normalized.includes("import")) {
    return "Import Workspace";
  }

  // Fallback
  return "Test Workspace";
}

// Track created workspaces per file (normalized file path)
const workspaceCache = new Map<string, string>();

// Normalize file path to ensure consistent caching
function normalizeFilePath(filePath: string): string {
  if (!filePath) return "default";
  // Extract just the filename to avoid absolute path differences
  const match = filePath.match(/([^/\\]+\.spec\.ts)$/);
  return match ? match[1] : filePath;
}

// Fixture to create and switch to a test workspace
export const testWithWorkspace = test.extend<{
  workspaceId: string;
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use, testInfo) => {
    await page.addInitScript(suppressNonCriticalErrors);

    await page.goto("/");
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });

    await page.waitForLoadState("domcontentloaded");
    await page
      .locator("#orcidLoginButton")
      .waitFor({ state: "visible", timeout: 10000 });
    await page.click("#orcidLoginButton");

    await page.waitForURL((url) => url.pathname !== "/login", {
      timeout: 20000,
    });
    await page.waitForLoadState("domcontentloaded");

    await handleUserSetup(page);

    await page
      .locator("#navSearchButtonDesktop, #navProjectsButtonDesktop")
      .first()
      .waitFor({
        state: "visible",
        timeout: 15000,
      });

    // Get workspace for this file
    const fileKey = normalizeFilePath(testInfo.file || "");
    const suiteName = testInfo.titlePath[0] || "default";
    const workspaceName = getWorkspaceNameForSuite(suiteName);

    let workspaceId = workspaceCache.get(fileKey);

    if (!workspaceId) {
      try {
        workspaceId = await createTestWorkspace(workspaceName);
        workspaceCache.set(fileKey, workspaceId);
      } catch (error) {
        console.error(`Failed to create workspace for ${fileKey}:`, error);
        throw error;
      }
    }

    await switchToWorkspace(page, workspaceName);

    await use(page);

    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
  },

  workspaceId: async (_args, use, testInfo) => {
    const fileKey = normalizeFilePath(testInfo.file || "");
    const workspaceId = workspaceCache.get(fileKey) || "";
    await use(workspaceId);
  },
});

export { expect } from "@playwright/test";
