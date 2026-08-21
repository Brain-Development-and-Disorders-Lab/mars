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
import { GraphQLError } from "graphql/index";

// Models
import { Admin } from "@models/Admin";
import { User } from "@models/User";
import { Workspaces } from "@models/Workspaces";

// Email
import { sendEmail, templates } from "@lib/email";

// Utility functions
import { isCollaborator } from "@lib/util";
import _ from "lodash";

const requireAdmin = (context: Context) => {
  if (context.userRole !== "admin") {
    throw new GraphQLError("You do not have permission to access this resource", {
      extensions: { code: "FORBIDDEN" },
    });
  }
};

// Restrict User mutations to the owning User themselves, or an admin
const requireSelfOrAdmin = (context: Context, targetId: string) => {
  if (context.user !== targetId && context.userRole !== "admin") {
    throw new GraphQLError("You do not have permission to access this resource", {
      extensions: { code: "FORBIDDEN" },
    });
  }
};

export const UserResolvers = {
  User: {
    // Restrict credential-bearing fields to the owning User or an admin
    api_keys: (parent: UserModel, _args: Record<string, unknown>, context: Context) =>
      context.user === parent._id || context.userRole === "admin" ? parent.api_keys : null,
    role: (parent: UserModel, _args: Record<string, unknown>, context: Context) =>
      context.user === parent._id || context.userRole === "admin" ? parent.role : null,
  },
  Query: {
    // Retrieve one User by _id
    user: async (_parent: IResolverParent, args: { _id: string }): Promise<UserModel | null> => {
      return await User.getOne(args._id);
    },

    // Retrieve one User by email
    userByEmail: async (_parent: IResolverParent, args: { email: string }): Promise<ResponseData<string>> => {
      return await User.getByEmail(args.email);
    },

    userGlobalPermissions: async (
      _parent: IResolverParent,
      args: { _id?: string },
      context: Context,
    ): Promise<UserGlobalPermissions> => {
      return await Admin.getUserGlobalPermissions(args._id ?? context.user);
    },

    userWorkspacePermissions: async (
      _parent: IResolverParent,
      args: { _id?: string; workspace?: string },
      context: Context,
    ): Promise<UserWorkspacePermissions> => {
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
      requireSelfOrAdmin(context, args.user._id);
      return await User.update(args.user);
    },

    // Update a User's global permissions; admin-only
    setUserGlobalPermissions: async (
      _parent: IResolverParent,
      args: { _id: string; permissions: UserGlobalPermissions },
      context: Context,
    ): Promise<IResponseMessage> => {
      requireAdmin(context);
      return await Admin.setUserGlobalPermissions(args._id, args.permissions);
    },

    // Update a User's Workspace permissions; restricted to the Workspace owner or a collaborator
    setUserWorkspacePermissions: async (
      _parent: IResolverParent,
      args: { _id: string; permissions: UserWorkspacePermissions },
      context: Context,
    ): Promise<IResponseMessage> => {
      const workspace = await Workspaces.getOne(context.workspace);
      if (
        workspace &&
        (isCollaborator(context.user, workspace.collaborators) || _.isEqual(workspace.owner, context.user))
      ) {
        return await Admin.setUserWorkspacePermissions(args._id, context.workspace, args.permissions);
      }
      throw new GraphQLError("You do not have permission to access this Workspace", {
        extensions: { code: "UNAUTHORIZED" },
      });
    },

    // Send a report issue email to the admin
    reportIssue: async (
      _parent: IResolverParent,
      args: {
        description: string;
        path: string;
        userName: string;
        userId: string;
        userEmail: string;
        consoleErrors: string[];
      },
    ): Promise<IResponseMessage> => {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail) {
        return { success: false, message: "ADMIN_EMAIL is not configured" };
      }
      const timestamp = new Date().toUTCString();
      await sendEmail({
        to: adminEmail,
        subject: "Issue Report - Metadatify",
        html: templates.reportIssue({
          description: args.description,
          path: args.path,
          userName: args.userName,
          userId: args.userId,
          userEmail: args.userEmail,
          consoleErrors: args.consoleErrors ?? [],
          timestamp,
        }),
      });
      return { success: true, message: "Report submitted" };
    },
  },
};
