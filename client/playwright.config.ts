/// <reference types="node" />
import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

export default defineConfig({
  testDir: "./test/playwright",
  fullyParallel: true,
  forbidOnly: process.env.CI ? true : false,
  globalTimeout: process.env.CI ? 60 * 1000 : undefined,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["html", { open: "never" }]],
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
      name: "test setup",
      testMatch: /global\.setup\.ts/,
      teardown: "test teardown",
    },
    {
      name: "test teardown",
      testMatch: /global\.teardown\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["test setup"],
    },
  ],
  webServer: {
    command: "yarn start",
    url: "http://127.0.0.1:8080",
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
