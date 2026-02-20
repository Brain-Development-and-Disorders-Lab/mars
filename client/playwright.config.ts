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
    baseURL: "http://127.0.0.1:8080",
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
      name: "setup user account",
      testMatch: /global\.setup\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup user account"],
    },
  ],
  webServer: {
    command: "yarn start",
    url: "http://127.0.0.1:8080",
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
