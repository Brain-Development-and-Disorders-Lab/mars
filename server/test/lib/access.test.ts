// .env configuration
import "dotenv/config";

// Jest imports
import { describe, expect, it } from "@jest/globals";

// Functions under test
import { assertWorkspaceUpdatePermitted } from "@lib/access";
import { DEFAULT_WORKSPACE_PERMISSIONS } from "@models/Admin";

// Types
import { Context, UserWorkspacePermissions, WorkspaceModel } from "@types";

import dayjs from "dayjs";
import _ from "lodash";

// Variables
const OWNER_ID = "owner-user";
const ADMIN_ID = "admin-collaborator";
const MEMBER_ID = "member-collaborator";
const OTHER_ID = "other-collaborator";

// Collaborator permissions with Workspace administration enabled
const ADMIN_PERMISSIONS: UserWorkspacePermissions = _.merge(_.cloneDeep(DEFAULT_WORKSPACE_PERMISSIONS), {
  administration: { edit: true, invite: true },
});

// Workspace with an administrating collaborator and two regular collaborators
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

// Request context for the given User within the test Workspace
const buildContext = (user: string): Context => ({ user, workspace: "workspace", userRole: "user" });

// Copy of the Workspace without the given collaborator
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
