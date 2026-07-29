// .env configuration
import "dotenv/config";

// Jest imports
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

// Models under test
import { Admin, DEFAULT_GLOBAL_PERMISSIONS, DEFAULT_WORKSPACE_PERMISSIONS } from "@models/Admin";
import { User } from "@models/User";
import { Workspaces } from "@models/Workspaces";

// Types
import { ResponseData, UserModel, UserWorkspacePermissions } from "@types";

// Database connectivity
import { connect, disconnect } from "@connectors/database";
import { clearDatabase } from "../helpers";

import dayjs from "dayjs";
import _ from "lodash";

// Variables
const OWNER_ID = "owner-user";
const COLLABORATOR_ID = "collaborator-user";
const OUTSIDER_ID = "outsider-user";

// Minimal UserModel instance, global permissions all disabled by default
const buildUser = (_id: string): UserModel => ({
  _id,
  firstName: "Test",
  lastName: "User",
  name: "Test User",
  affiliation: "",
  email: `${_id}@test.com`,
  emailVerified: true,
  image: "",
  createdAt: dayjs(Date.now()).toISOString(),
  updatedAt: dayjs(Date.now()).toISOString(),
  lastLogin: dayjs(Date.now()).toISOString(),
  api_keys: JSON.stringify([]),
  role: "user",
  banned: false,
  permissions: DEFAULT_GLOBAL_PERMISSIONS,
  account_orcid: "",
});

const createWorkspace = async (collaboratorPermissions: UserWorkspacePermissions): Promise<string> => {
  const result: ResponseData<string> = await Workspaces.create({
    name: "Test Workspace",
    owner: OWNER_ID,
    public: false,
    description: "Workspace for permission tests",
    collaborators: [{ _id: COLLABORATOR_ID, permissions: collaboratorPermissions }],
    entities: [],
    projects: [],
    templates: [],
    activity: [],
  });
  return result.data;
};

describe("Admin model permissions", () => {
  beforeEach(async () => {
    await connect();
    await clearDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
    await disconnect();
  });

  describe("Global permissions", () => {
    it("returns default permissions for a User that doesn't exist", async () => {
      const permissions = await Admin.getUserGlobalPermissions("nonexistent");
      expect(permissions).toEqual(DEFAULT_GLOBAL_PERMISSIONS);
    });

    it("enables a Global permission", async () => {
      await User.create(buildUser(OWNER_ID));

      const updated = _.cloneDeep(DEFAULT_GLOBAL_PERMISSIONS);
      updated.features.ai = true;
      const result = await Admin.setUserGlobalPermissions(OWNER_ID, updated);
      expect(result.success).toBeTruthy();

      const permissions = await Admin.getUserGlobalPermissions(OWNER_ID);
      expect(permissions.features.ai).toBeTruthy();
      expect(permissions.features.scan).toBeFalsy();
    });

    it("disables a previously enabled Global permission", async () => {
      await User.create(buildUser(OWNER_ID));

      const enabled = _.cloneDeep(DEFAULT_GLOBAL_PERMISSIONS);
      enabled.workspaces.create = true;
      await Admin.setUserGlobalPermissions(OWNER_ID, enabled);

      const disabled = _.cloneDeep(enabled);
      disabled.workspaces.create = false;
      await Admin.setUserGlobalPermissions(OWNER_ID, disabled);

      const permissions = await Admin.getUserGlobalPermissions(OWNER_ID);
      expect(permissions.workspaces.create).toBeFalsy();
    });

    it("fails to update permissions for a User that doesn't exist", async () => {
      const result = await Admin.setUserGlobalPermissions("nonexistent", DEFAULT_GLOBAL_PERMISSIONS);
      expect(result.success).toBeFalsy();
    });
  });

  describe("Workspace-scoped permissions", () => {
    it("returns default permissions when the Workspace doesn't exist", async () => {
      const permissions = await Admin.getUserWorkspacePermissions(COLLABORATOR_ID, "nonexistent");
      expect(permissions).toEqual(DEFAULT_WORKSPACE_PERMISSIONS);
    });

    it("grants the owner full permissions even without a Collaborator entry", async () => {
      const workspaceId = await createWorkspace(DEFAULT_WORKSPACE_PERMISSIONS);

      const permissions = await Admin.getUserWorkspacePermissions(OWNER_ID, workspaceId);
      expect(permissions.entities.create).toBeTruthy();
      expect(permissions.projects.archive).toBeTruthy();
      expect(permissions.administration.invite).toBeTruthy();
    });

    it("returns a Collaborator's stored permissions rather than the defaults", async () => {
      const collaboratorPermissions = _.cloneDeep(DEFAULT_WORKSPACE_PERMISSIONS);
      collaboratorPermissions.entities.create = true;
      const workspaceId = await createWorkspace(collaboratorPermissions);

      const permissions = await Admin.getUserWorkspacePermissions(COLLABORATOR_ID, workspaceId);
      expect(permissions.entities.create).toBeTruthy();
      expect(permissions.entities.edit).toBeFalsy();
    });

    it("enables a specific permission for a Collaborator without touching the others", async () => {
      const workspaceId = await createWorkspace(DEFAULT_WORKSPACE_PERMISSIONS);

      const result = await Admin.setUserWorkspacePermissions(COLLABORATOR_ID, workspaceId, {
        projects: { create: true, edit: false, archive: false },
      });
      expect(result.success).toBeTruthy();

      const permissions = await Admin.getUserWorkspacePermissions(COLLABORATOR_ID, workspaceId);
      expect(permissions.projects.create).toBeTruthy();
      expect(permissions.entities.create).toBeFalsy();
    });

    it("disables a previously enabled permission for a Collaborator", async () => {
      const enabled = _.cloneDeep(DEFAULT_WORKSPACE_PERMISSIONS);
      enabled.templates.archive = true;
      const workspaceId = await createWorkspace(enabled);

      await Admin.setUserWorkspacePermissions(COLLABORATOR_ID, workspaceId, {
        templates: { create: false, edit: false, archive: false },
      });

      const permissions = await Admin.getUserWorkspacePermissions(COLLABORATOR_ID, workspaceId);
      expect(permissions.templates.archive).toBeFalsy();
    });

    it("fails to update permissions for a User who isn't a Collaborator", async () => {
      const workspaceId = await createWorkspace(DEFAULT_WORKSPACE_PERMISSIONS);

      const result = await Admin.setUserWorkspacePermissions(OUTSIDER_ID, workspaceId, {
        entities: { create: true, edit: false, archive: false },
      });
      expect(result.success).toBeFalsy();
    });
  });

  describe("Collated permissions", () => {
    it("combines Global and Workspace permissions for a Collaborator", async () => {
      await User.create(buildUser(COLLABORATOR_ID));
      const global = _.cloneDeep(DEFAULT_GLOBAL_PERMISSIONS);
      global.features.api = true;
      await Admin.setUserGlobalPermissions(COLLABORATOR_ID, global);

      const workspacePermissions = _.cloneDeep(DEFAULT_WORKSPACE_PERMISSIONS);
      workspacePermissions.entities.edit = true;
      const workspaceId = await createWorkspace(workspacePermissions);

      const collated = await Admin.getUserCollatedPermissions(COLLABORATOR_ID, workspaceId);
      expect(collated.global.features.api).toBeTruthy();
      expect(collated.workspace.entities.edit).toBeTruthy();
      expect(collated.workspace.entities.create).toBeFalsy();
    });

    it("grants the owner full Workspace permissions regardless of stored Global permissions", async () => {
      await User.create(buildUser(OWNER_ID));
      const workspaceId = await createWorkspace(DEFAULT_WORKSPACE_PERMISSIONS);

      const collated = await Admin.getUserCollatedPermissions(OWNER_ID, workspaceId);
      expect(collated.workspace.entities.create).toBeTruthy();
      expect(collated.workspace.administration.edit).toBeTruthy();
    });
  });

  describe("Workspace access", () => {
    it("grants access to the owner", async () => {
      const workspaceId = await createWorkspace(DEFAULT_WORKSPACE_PERMISSIONS);
      expect(await Workspaces.checkAccess(OWNER_ID, workspaceId)).toBeTruthy();
    });

    it("grants access to a Collaborator", async () => {
      const workspaceId = await createWorkspace(DEFAULT_WORKSPACE_PERMISSIONS);
      expect(await Workspaces.checkAccess(COLLABORATOR_ID, workspaceId)).toBeTruthy();
    });

    it("denies access to a User who is neither the owner nor a Collaborator", async () => {
      const workspaceId = await createWorkspace(DEFAULT_WORKSPACE_PERMISSIONS);
      expect(await Workspaces.checkAccess(OUTSIDER_ID, workspaceId)).toBeFalsy();
    });
  });
});
