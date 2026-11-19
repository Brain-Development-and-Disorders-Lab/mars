// .env configuration
import "dotenv/config";

// Jest imports
import { describe, expect, it } from "@jest/globals";

// Functions under test
import { assertPreviewOperationPermitted, assertWorkspaceUpdatePermitted } from "@lib/access";
import { DEFAULT_WORKSPACE_PERMISSIONS } from "@models/Admin";

// Types
import { Context, UserRole, UserWorkspacePermissions, WorkspaceModel } from "@types";

// GraphQL parsing
import { OperationDefinitionNode, parse } from "graphql";

import dayjs from "dayjs";
import _ from "lodash";

// Variables
const OWNER_ID = "owner-user";
const ADMIN_ID = "admin-collaborator";
const MEMBER_ID = "member-collaborator";
const OTHER_ID = "other-collaborator";

// Administration permissions
const ADMIN_PERMISSIONS: UserWorkspacePermissions = _.merge(_.cloneDeep(DEFAULT_WORKSPACE_PERMISSIONS), {
  administration: { edit: true, invite: true },
});

// Test Workspace
const buildWorkspace = (): WorkspaceModel => ({
  _id: "workspace",
  timestamp: dayjs(Date.now()).toISOString(),
  name: "Test Workspace",
  owner: OWNER_ID,
  isPublic: false,
  description: "Workspace for update permission tests",
  collaborators: [
    { _id: ADMIN_ID, permissions: _.cloneDeep(ADMIN_PERMISSIONS) },
    { _id: MEMBER_ID, permissions: _.cloneDeep(DEFAULT_WORKSPACE_PERMISSIONS) },
    { _id: OTHER_ID, permissions: _.cloneDeep(DEFAULT_WORKSPACE_PERMISSIONS) },
  ],
  entities: [],
  projects: [],
  attributes: [],
  activity: [],
});

// Request context
const buildContext = (user: string): Context => ({ user, workspace: "workspace", userRole: "user" });

// Request context with a specific role
const buildRoleContext = (userRole: UserRole): Context => ({ user: MEMBER_ID, workspace: "workspace", userRole });

// Parse the first operation of a GraphQL document
const parseOperation = (source: string): OperationDefinitionNode =>
  parse(source).definitions[0] as OperationDefinitionNode;

// Remove a collaborator
const withoutCollaborator = (workspace: WorkspaceModel, _id: string): WorkspaceModel => ({
  ...workspace,
  collaborators: workspace.collaborators.filter((collaborator) => collaborator._id !== _id),
});

describe("Workspace update permissions", () => {
  describe("Leaving a Workspace", () => {
    it("allows a collaborator without administration rights to remove themselves", () => {
      const workspace = buildWorkspace();
      expect(() =>
        assertWorkspaceUpdatePermitted(buildContext(MEMBER_ID), workspace, withoutCollaborator(workspace, MEMBER_ID)),
      ).not.toThrow();
    });

    it("prevents a collaborator without administration rights from removing someone else", () => {
      const workspace = buildWorkspace();
      expect(() =>
        assertWorkspaceUpdatePermitted(buildContext(MEMBER_ID), workspace, withoutCollaborator(workspace, OTHER_ID)),
      ).toThrow();
    });

    it("prevents leaving while also removing someone else", () => {
      const workspace = buildWorkspace();
      const updated = withoutCollaborator(withoutCollaborator(workspace, MEMBER_ID), OTHER_ID);
      expect(() => assertWorkspaceUpdatePermitted(buildContext(MEMBER_ID), workspace, updated)).toThrow();
    });

    it("prevents leaving while also changing the Workspace details", () => {
      const workspace = buildWorkspace();
      const updated = { ...withoutCollaborator(workspace, MEMBER_ID), name: "Renamed Workspace" };
      expect(() => assertWorkspaceUpdatePermitted(buildContext(MEMBER_ID), workspace, updated)).toThrow();
    });
  });

  describe("Managing collaborators", () => {
    it("allows a collaborator with administration rights to remove someone else", () => {
      const workspace = buildWorkspace();
      expect(() =>
        assertWorkspaceUpdatePermitted(buildContext(ADMIN_ID), workspace, withoutCollaborator(workspace, OTHER_ID)),
      ).not.toThrow();
    });

    it("allows the owner to remove a collaborator", () => {
      const workspace = buildWorkspace();
      expect(() =>
        assertWorkspaceUpdatePermitted(buildContext(OWNER_ID), workspace, withoutCollaborator(workspace, OTHER_ID)),
      ).not.toThrow();
    });

    it("prevents a collaborator without administration rights from granting permissions", () => {
      const workspace = buildWorkspace();
      const updated = _.cloneDeep(workspace);
      updated.collaborators[2].permissions.entities.create = true;
      expect(() => assertWorkspaceUpdatePermitted(buildContext(MEMBER_ID), workspace, updated)).toThrow();
    });

    it("prevents the owner from being added as a collaborator", () => {
      const workspace = buildWorkspace();
      const updated = _.cloneDeep(workspace);
      updated.collaborators.push({ _id: OWNER_ID, permissions: _.cloneDeep(DEFAULT_WORKSPACE_PERMISSIONS) });
      expect(() => assertWorkspaceUpdatePermitted(buildContext(OWNER_ID), workspace, updated)).toThrow();
    });
  });
});

describe("Preview operation permissions", () => {
  it("allows read queries for preview Users", () => {
    const operation = parseOperation("query { entities { total } workspaces { _id } }");
    expect(() => assertPreviewOperationPermitted(buildRoleContext("preview"), operation)).not.toThrow();
  });

  it("prevents mutations for preview Users", () => {
    const operation = parseOperation('mutation { archiveEntity(_id: "e1", state: true) { success } }');
    expect(() => assertPreviewOperationPermitted(buildRoleContext("preview"), operation)).toThrow(
      "Preview accounts are read-only",
    );
  });

  it("prevents queries that write data for preview Users", () => {
    const operation = parseOperation('query { generateKey(scope: "view", workspaces: []) { success } }');
    expect(() => assertPreviewOperationPermitted(buildRoleContext("preview"), operation)).toThrow();
  });

  it("prevents AI queries for preview Users", () => {
    const operation = parseOperation('query { translateSearch(query: "samples") }');
    expect(() => assertPreviewOperationPermitted(buildRoleContext("preview"), operation)).toThrow();
  });

  it("prevents root fragments for preview Users", () => {
    const operation = parseOperation("query { ... on Query { workspaces { _id } } }");
    expect(() => assertPreviewOperationPermitted(buildRoleContext("preview"), operation)).toThrow();
  });

  it("allows mutations for standard Users and admins", () => {
    const operation = parseOperation('mutation { archiveEntity(_id: "e1", state: true) { success } }');
    expect(() => assertPreviewOperationPermitted(buildRoleContext("user"), operation)).not.toThrow();
    expect(() => assertPreviewOperationPermitted(buildRoleContext("admin"), operation)).not.toThrow();
  });
});
