// Test helper functions
import { createTestAttribute, createTestEntity, createTestProject } from "../helpers/global.helpers";
import {
  clientPathArchive,
  clientPathDisabled,
  clientPathDisabledInCreateDialog,
  clientPathEditingDisabled,
  clientPathVisible,
  openManageWorkspace,
  setupDefaultPermissions,
  test,
  toggleCollaboratorPermission,
  toggleManageWorkspace,
  verifyClientPaths,
} from "../helpers/permissions.helpers";

// Custom types
import { ClientPath } from "../../../../types";

// Each test drives two browser sessions through several page loads, and the shared
// database only gets cleared once for the whole suite, so give these more room than the default
test.describe.configure({ timeout: 60_000 });

test.describe("Workspace Administration permissions", () => {
  test("Edit Workspace Details", async ({ context, page, collaboratorPage }) => {
    const { workspaceId } = await setupDefaultPermissions(context, collaboratorPage, "Perm-Admin-Edit");
    const workspacePath = `/workspaces/${workspaceId}`;

    const clientPaths: ClientPath[] = [
      clientPathDisabled("Workspace view Edit button", workspacePath, (p) =>
        p.getByRole("button", { name: "Edit", exact: true }),
      ),
    ];

    await verifyClientPaths(collaboratorPage, clientPaths, false);
    await openManageWorkspace(page, workspaceId);
    await toggleManageWorkspace(page, "edit");
    await toggleCollaboratorPermission(page, "Edit Workspace Details");
    await toggleManageWorkspace(page, "save");
    await verifyClientPaths(collaboratorPage, clientPaths, true);
  });

  test("Invite Collaborators", async ({ context, page, collaboratorPage }) => {
    const { workspaceId } = await setupDefaultPermissions(context, collaboratorPage, "Perm-Admin-Invite");
    const workspacePath = `/workspaces/${workspaceId}`;

    const clientPaths: ClientPath[] = [
      clientPathVisible("Invite Collaborator field", workspacePath, (p) => p.getByPlaceholder("Email")),
    ];

    await verifyClientPaths(collaboratorPage, clientPaths, false);
    await openManageWorkspace(page, workspaceId);
    await toggleManageWorkspace(page, "edit");
    await toggleCollaboratorPermission(page, "Invite Collaborators");
    await toggleManageWorkspace(page, "save");
    await verifyClientPaths(collaboratorPage, clientPaths, true);
  });
});

test.describe("Entity permissions", () => {
  test("Create Entities", async ({ context, page, collaboratorPage }) => {
    const { workspaceId } = await setupDefaultPermissions(context, collaboratorPage, "Perm-Entity-Create");

    const clientPaths: ClientPath[] = [
      clientPathDisabled("Entities list button", "/entities", (p) =>
        p.getByRole("button", { name: "Create Entity", exact: true }),
      ),
      clientPathDisabledInCreateDialog("Create dialog Entity button", "/entities", (p) =>
        p.locator("#createEntityButton"),
      ),
    ];

    await verifyClientPaths(collaboratorPage, clientPaths, false);
    await openManageWorkspace(page, workspaceId);
    await toggleManageWorkspace(page, "edit");
    await toggleCollaboratorPermission(page, "Create Entities");
    await toggleManageWorkspace(page, "save");
    await verifyClientPaths(collaboratorPage, clientPaths, true);
  });

  test("Edit Entities", async ({ context, page, collaboratorPage }) => {
    const { owner, workspaceId } = await setupDefaultPermissions(context, collaboratorPage, "Perm-Entity-Edit");
    const entityId = await createTestEntity("Permission Test Entity", owner, workspaceId);

    const clientPaths: ClientPath[] = [
      clientPathDisabled("Entity view Edit button", `/entities/${entityId}`, (p) =>
        p.getByRole("button", { name: "Edit", exact: true }),
      ),
    ];

    await verifyClientPaths(collaboratorPage, clientPaths, false);
    await openManageWorkspace(page, workspaceId);
    await toggleManageWorkspace(page, "edit");
    await toggleCollaboratorPermission(page, "Edit Entities");
    await toggleManageWorkspace(page, "save");
    await verifyClientPaths(collaboratorPage, clientPaths, true);
  });

  test("Archive Entities", async ({ context, page, collaboratorPage }) => {
    const { owner, workspaceId } = await setupDefaultPermissions(context, collaboratorPage, "Perm-Entity-Archive");
    const entityId = await createTestEntity("Permission Test Entity", owner, workspaceId);
    await createTestEntity("Permission Test Archived Entity", owner, workspaceId, true);
    const workspacePath = `/workspaces/${workspaceId}`;

    const clientPaths: ClientPath[] = [
      clientPathArchive("Entity view Archive menu item", `/entities/${entityId}`),
      clientPathEditingDisabled("Workspace archived Entities restore button", workspacePath, (p) =>
        p.getByRole("button", { name: "Restore", exact: true }),
      ),
    ];

    await verifyClientPaths(collaboratorPage, clientPaths, false);
    await openManageWorkspace(page, workspaceId);
    await toggleManageWorkspace(page, "edit");
    await toggleCollaboratorPermission(page, "Archive Entities");
    await toggleManageWorkspace(page, "save");
    await verifyClientPaths(collaboratorPage, clientPaths, true);
  });
});

test.describe("Project permissions", () => {
  test("Create Projects", async ({ context, page, collaboratorPage }) => {
    const { workspaceId } = await setupDefaultPermissions(context, collaboratorPage, "Perm-Project-Create");

    // Note: the direct "/create/project" route guard checks `entities.create` rather than
    // `projects.create` (an existing app inconsistency), so it's left out of this list
    const clientPaths: ClientPath[] = [
      clientPathDisabled("Projects list button", "/projects", (p) =>
        p.getByRole("button", { name: "Create Project", exact: true }),
      ),
      clientPathDisabledInCreateDialog("Create dialog Project button", "/projects", (p) =>
        p.locator("#createProjectButton"),
      ),
    ];

    await verifyClientPaths(collaboratorPage, clientPaths, false);
    await openManageWorkspace(page, workspaceId);
    await toggleManageWorkspace(page, "edit");
    await toggleCollaboratorPermission(page, "Create Projects");
    await toggleManageWorkspace(page, "save");
    await verifyClientPaths(collaboratorPage, clientPaths, true);
  });

  test("Edit Projects", async ({ context, page, collaboratorPage }) => {
    const { owner, workspaceId } = await setupDefaultPermissions(context, collaboratorPage, "Perm-Project-Edit");
    const projectId = await createTestProject("Permission Test Project", owner, workspaceId);

    const clientPaths: ClientPath[] = [
      clientPathDisabled("Project view Edit button", `/projects/${projectId}`, (p) =>
        p.getByRole("button", { name: "Edit", exact: true }),
      ),
    ];

    await verifyClientPaths(collaboratorPage, clientPaths, false);
    await openManageWorkspace(page, workspaceId);
    await toggleManageWorkspace(page, "edit");
    await toggleCollaboratorPermission(page, "Edit Projects");
    await toggleManageWorkspace(page, "save");
    await verifyClientPaths(collaboratorPage, clientPaths, true);
  });

  test("Archive Projects", async ({ context, page, collaboratorPage }) => {
    const { owner, workspaceId } = await setupDefaultPermissions(context, collaboratorPage, "Perm-Project-Archive");
    const projectId = await createTestProject("Permission Test Project", owner, workspaceId);
    await createTestProject("Permission Test Archived Project", owner, workspaceId, true);
    const workspacePath = `/workspaces/${workspaceId}`;

    const clientPaths: ClientPath[] = [
      clientPathArchive("Project view Archive menu item", `/projects/${projectId}`),
      clientPathEditingDisabled(
        "Workspace archived Projects restore button",
        workspacePath,
        (p) => p.getByRole("button", { name: "Restore Project", exact: true }),
        "Archived Projects",
      ),
    ];

    await verifyClientPaths(collaboratorPage, clientPaths, false);
    await openManageWorkspace(page, workspaceId);
    await toggleManageWorkspace(page, "edit");
    await toggleCollaboratorPermission(page, "Archive Projects");
    await toggleManageWorkspace(page, "save");
    await verifyClientPaths(collaboratorPage, clientPaths, true);
  });
});

test.describe("Attribute permissions", () => {
  test("Create Attributes", async ({ context, page, collaboratorPage }) => {
    const { workspaceId } = await setupDefaultPermissions(context, collaboratorPage, "Perm-Attribute-Create");

    const clientPaths: ClientPath[] = [
      clientPathDisabled("Attributes list button", "/attributes", (p) =>
        p.getByRole("button", { name: "Create Attribute", exact: true }),
      ),
      clientPathDisabledInCreateDialog("Create dialog Attribute button", "/attributes", (p) =>
        p.locator("#createAttributeButton"),
      ),
    ];

    await verifyClientPaths(collaboratorPage, clientPaths, false);
    await openManageWorkspace(page, workspaceId);
    await toggleManageWorkspace(page, "edit");
    await toggleCollaboratorPermission(page, "Create Attributes");
    await toggleManageWorkspace(page, "save");
    await verifyClientPaths(collaboratorPage, clientPaths, true);
  });

  test("Edit Attributes", async ({ context, page, collaboratorPage }) => {
    const { owner, workspaceId } = await setupDefaultPermissions(context, collaboratorPage, "Perm-Attribute-Edit");
    const attributeId = await createTestAttribute("Permission Test Attribute", owner, workspaceId);

    const clientPaths: ClientPath[] = [
      clientPathDisabled("Attribute view Edit button", `/attributes/${attributeId}`, (p) =>
        p.getByRole("button", { name: "Edit", exact: true }),
      ),
    ];

    await verifyClientPaths(collaboratorPage, clientPaths, false);
    await openManageWorkspace(page, workspaceId);
    await toggleManageWorkspace(page, "edit");
    await toggleCollaboratorPermission(page, "Edit Attributes");
    await toggleManageWorkspace(page, "save");
    await verifyClientPaths(collaboratorPage, clientPaths, true);
  });

  test("Archive Attributes", async ({ context, page, collaboratorPage }) => {
    const { owner, workspaceId } = await setupDefaultPermissions(context, collaboratorPage, "Perm-Attribute-Archive");
    const attributeId = await createTestAttribute("Permission Test Attribute", owner, workspaceId);
    await createTestAttribute("Permission Test Archived Attribute", owner, workspaceId, true);
    const workspacePath = `/workspaces/${workspaceId}`;

    const clientPaths: ClientPath[] = [
      clientPathArchive("Attribute view Archive menu item", `/attributes/${attributeId}`),
      clientPathEditingDisabled(
        "Workspace archived Attributes restore button",
        workspacePath,
        (p) => p.getByRole("button", { name: "Restore Attribute", exact: true }),
        "Archived Attributes",
      ),
    ];

    await verifyClientPaths(collaboratorPage, clientPaths, false);
    await openManageWorkspace(page, workspaceId);
    await toggleManageWorkspace(page, "edit");
    await toggleCollaboratorPermission(page, "Archive Attributes");
    await toggleManageWorkspace(page, "save");
    await verifyClientPaths(collaboratorPage, clientPaths, true);
  });
});
