/// <reference types="node" />
import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

export default defineConfig({
  testDir: "./test/playwright",
  fullyParallel: true,
  forbidOnly: process.env.CI ? true : false,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    ignoreHTTPSErrors: true,
  },
  expect: {
    timeout: 10000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "npm run start",
    url: "http://localhost:8080",
    reuseExistingServer: process.env.CI ? false : true,
    timeout: 120 * 1000,
  },

  globalSetup: require.resolve("./test/playwright/global-setup.ts"),
  globalTeardown: require.resolve("./test/playwright/global-teardown.ts"),
});
