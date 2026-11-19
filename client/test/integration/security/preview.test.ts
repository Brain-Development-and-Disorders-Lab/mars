// Playwright imports
import { expect } from "@playwright/test";

// Test helper functions
import { createTestUser, createTestWorkspace, getUniqueName } from "../helpers/global.helpers";
import { test } from "../helpers/permissions.helpers";

// Server models, used to seed the preview User with every Workspace permission
import { OWNER_WORKSPACE_PERMISSIONS } from "../../../../server/src/models/Admin";

// Server and client origins
const API_URL = "http://127.0.0.1:8000";
const APP_URL = "http://127.0.0.1:8080";

test.describe.configure({ timeout: 60_000 });

test.describe("Preview accounts", () => {
  let workspaceId = "";

  // Preview User holds every Workspace permission, which the role must override
  test.beforeEach(async ({ context, collaboratorPage }) => {
    const owner = await createTestUser(context, { name: "Test Owner" });
    const preview = await createTestUser(collaboratorPage.context(), {
      email: `${getUniqueName("preview").replace(/\s+/g, "-").toLowerCase()}@test.com`,
      name: "Test Preview",
      role: "preview",
    });
    workspaceId = await createTestWorkspace(getUniqueName("Preview Workspace"), owner, [
      { _id: preview, permissions: OWNER_WORKSPACE_PERMISSIONS },
    ]);

    await collaboratorPage.goto("/");
    await collaboratorPage.waitForLoadState("networkidle");
  });

  test("profile page is read-only", async ({ collaboratorPage }) => {
    await collaboratorPage.goto("/profile");
    await expect(collaboratorPage.getByText("Preview Account")).toBeVisible();
    await expect(collaboratorPage.getByRole("button", { name: "Edit", exact: true })).toHaveCount(0);
    await expect(collaboratorPage.getByRole("button", { name: "Connect ORCiD" })).toHaveCount(0);
  });

  test("issues cannot be reported", async ({ collaboratorPage }) => {
    await expect(collaboratorPage.locator("#navBugButtonDesktop")).toBeDisabled();
  });

  test("Workspace cannot be edited", async ({ collaboratorPage }) => {
    await collaboratorPage.goto(`/workspaces/${workspaceId}`);
    await expect(collaboratorPage.getByRole("button", { name: "Edit", exact: true })).toBeDisabled();
  });

  test("GraphQL queries are permitted and mutations are rejected", async ({ collaboratorPage }) => {
    const headers = { "Content-Type": "application/json", workspace: workspaceId, Origin: APP_URL };

    const query = await collaboratorPage.request.post(`${API_URL}/`, {
      headers,
      data: { query: "query { workspaces { _id } }" },
    });
    const queryBody = await query.json();
    expect(queryBody.errors).toBeUndefined();
    expect(queryBody.data.workspaces.length).toBeGreaterThan(0);

    const mutation = await collaboratorPage.request.post(`${API_URL}/`, {
      headers,
      data: { query: 'mutation { revokeKey(key: "none") { success } }' },
    });
    const mutationBody = await mutation.json();
    expect(mutationBody.errors[0].extensions.code).toBe("FORBIDDEN");
  });

  test("account changes are rejected by the auth server", async ({ collaboratorPage }) => {
    const headers = { "Content-Type": "application/json", Origin: APP_URL };

    const updateUser = await collaboratorPage.request.post(`${API_URL}/auth/update-user`, {
      headers,
      data: { name: "Changed Name" },
    });
    expect(updateUser.status()).toBe(403);

    const changePassword = await collaboratorPage.request.post(`${API_URL}/auth/change-password`, {
      headers,
      data: { currentPassword: "password", newPassword: "new-password-123" },
    });
    expect(changePassword.status()).toBe(403);
  });
});
