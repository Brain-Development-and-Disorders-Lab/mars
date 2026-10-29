import {
  Context,
  IResolverParent,
  IResponseMessage,
  ResponseData,
  UserCollatedPermissions,
  UserGlobalPermissions,
  UserModel,
  UserWorkspacePermissions,
} from "@types";

// Models
import { Admin } from "@models/Admin";
import { User } from "@models/User";
import { Workspaces } from "@models/Workspaces";

// Email
import { sendEmail, emailTemplates } from "@lib/email";

// Utility functions
import _ from "lodash";

// Access control
import { assertAdmin, assertSelfOrAdmin, assertWorkspaceAccess } from "@lib/access";

// Contact details are visible to the User themselves, admins, and Users who share a Workspace with them
const canViewContactDetails = async (context: Context, targetId: string): Promise<boolean> => {
  if (context.user === "") return false;
  if (context.user === targetId || context.userRole === "admin") return true;
  return await Workspaces.shareWorkspace(context.user, targetId);
};

export const UserResolvers = {
  User: {
    // Restrict credential-bearing fields to the owning User or an admin
    api_keys: (parent: UserModel, _args: Record<string, unknown>, context: Context) =>
      context.user === parent._id || context.userRole === "admin" ? parent.api_keys : null,
    role: (parent: UserModel, _args: Record<string, unknown>, context: Context) =>
      context.user === parent._id || context.userRole === "admin" ? parent.role : null,
    email: async (parent: UserModel, _args: Record<string, unknown>, context: Context) =>
      (await canViewContactDetails(context, parent._id)) ? parent.email : null,
    emailVerified: async (parent: UserModel, _args: Record<string, unknown>, context: Context) =>
      (await canViewContactDetails(context, parent._id)) ? parent.emailVerified : null,
  },
  Query: {
    // Retrieve one User by _id
    user: async (_parent: IResolverParent, args: { _id: string }): Promise<UserModel | null> => {
      return await User.getOne(args._id);
    },

    // Retrieve one User by email
    userByEmail: async (_parent: IResolverParent, args: { email: string }): Promise<ResponseData<string>> => {
      return await User.getByEmail(_.toLower(_.trim(args.email)));
    },

    userGlobalPermissions: async (
      _parent: IResolverParent,
      args: { _id?: string },
      context: Context,
    ): Promise<UserGlobalPermissions> => {
      assertSelfOrAdmin(context, args._id ?? context.user);
      return await Admin.getUserGlobalPermissions(args._id ?? context.user);
    },

    userWorkspacePermissions: async (
      _parent: IResolverParent,
      args: { _id?: string; workspace?: string },
      context: Context,
    ): Promise<UserWorkspacePermissions> => {
      assertSelfOrAdmin(context, args._id ?? context.user);
      return await Admin.getUserWorkspacePermissions(args._id ?? context.user, args.workspace ?? context.workspace);
    },

    userCollatedPermissions: async (
      _parent: IResolverParent,
      _args: Record<string, unknown>,
      context: Context,
    ): Promise<UserCollatedPermissions> => {
      return await Admin.getUserCollatedPermissions(context.user, context.workspace);
    },
  },
  Mutation: {
    // Update a User; restricted to the User themselves or an admin
    updateUser: async (
      _parent: IResolverParent,
      args: { user: UserModel },
      context: Context,
    ): Promise<IResponseMessage> => {
      assertSelfOrAdmin(context, args.user._id);
      return await User.update(args.user);
    },

    // Update a User's global permissions; admin-only
    setUserGlobalPermissions: async (
      _parent: IResolverParent,
      args: { _id: string; permissions: UserGlobalPermissions },
      context: Context,
    ): Promise<IResponseMessage> => {
      assertAdmin(context);
      return await Admin.setUserGlobalPermissions(args._id, args.permissions);
    },

    // Update a User's Workspace permissions, restricted to Users with Workspace admin rights
    setUserWorkspacePermissions: async (
      _parent: IResolverParent,
      args: { _id: string; permissions: UserWorkspacePermissions },
      context: Context,
    ): Promise<IResponseMessage> => {
      const workspace = await assertWorkspaceAccess(context, "administration.edit");
      return await Admin.setUserWorkspacePermissions(args._id, workspace._id, args.permissions);
    },

    // Send a report issue email to the admin
    reportIssue: async (
      _parent: IResolverParent,
      args: {
        description: string;
        path: string;
        consoleErrors: string[];
      },
      context: Context,
    ): Promise<IResponseMessage> => {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail) {
        return { success: false, message: "ADMIN_EMAIL is not configured" };
      }

      // Identify the reporter from their session rather than client-supplied details
      const reporter = await User.getOne(context.user);
      const timestamp = new Date().toUTCString();
      await sendEmail({
        to: adminEmail,
        subject: "Issue Report - Metadatify",
        html: emailTemplates.reportIssue({
          description: args.description,
          path: args.path,
          userName: reporter?.name ?? "Unknown",
          userId: context.user,
          userEmail: reporter?.email ?? "Unknown",
          consoleErrors: args.consoleErrors ?? [],
          timestamp,
        }),
      });
      return { success: true, message: "Report submitted" };
    },
  },
};
