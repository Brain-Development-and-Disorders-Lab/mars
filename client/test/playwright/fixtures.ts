import { test as base, Page } from "@playwright/test";

/**
 * Suppress console errors and unhandled rejections for known non-critical errors
 */
function suppressNonCriticalErrors() {
  const ignoredPatterns = [
    /AbortError/i,
    /Request aborted/i,
    /net::ERR_ABORTED/i,
    /The operation was aborted/i,
    /the user aborted a request/i,
    /ResizeObserver loop/i,
  ];

  const originalConsoleError = window.console.error;
  window.console.error = (...args: unknown[]) => {
    const error = args[0];
    if (error instanceof DOMException && error.name === "AbortError") {
      return;
    }
    const message = args.map((arg) => String(arg)).join(" ");
    if (!ignoredPatterns.some((pattern) => pattern.test(message))) {
      originalConsoleError.apply(window.console, args);
    }
  };

  // Suppress unhandled rejections
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    if (reason instanceof DOMException && reason.name === "AbortError") {
      event.preventDefault();
      event.stopImmediatePropagation?.();
      return;
    }
    const reasonMessage = reason?.message || String(reason || "");
    const errorName = reason?.name || "";
    if (
      ignoredPatterns.some((pattern) => pattern.test(reasonMessage)) ||
      errorName === "AbortError"
    ) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  });

  // Suppress error events
  window.addEventListener("error", (event) => {
    const error = event.error;
    if (error instanceof DOMException && error.name === "AbortError") {
      event.preventDefault();
      event.stopImmediatePropagation?.();
      return;
    }
    const message = event.message || String(error || "");
    const errorName = error?.name || "";
    if (
      ignoredPatterns.some((pattern) => pattern.test(message)) ||
      errorName === "AbortError"
    ) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  });
}

/**
 * Handle user setup if needed
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

// Extend base test with authentication fixture
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

export { expect } from "@playwright/test";
