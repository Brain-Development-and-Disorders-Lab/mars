import {
  AdminMetrics,
  AdminUser,
  AdminWorkspace,
  Context,
  IResolverParent,
  IResponseMessage,
  UserFeatures,
} from "@types";
import { GraphQLError } from "graphql/index";

// Models
import { Admin } from "@models/Admin";

// Audit logging
import { audit } from "@lib/audit";

const requireAdmin = (context: Context) => {
  if (context.userRole !== "admin") {
    audit("permission.denied", context.user, { gqlOperation: "admin", errorCode: "FORBIDDEN" });
    throw new GraphQLError("You do not have permission to access this resource", {
      extensions: { code: "FORBIDDEN" },
    });
  }
};

export const AdminResolvers = {
  Query: {
    currentUserFeatures: async (
      _parent: IResolverParent,
      _args: Record<string, unknown>,
      context: Context,
    ): Promise<UserFeatures> => {
      return await Admin.getCurrentUserFeatures(context.user);
    },

    adminMetrics: async (
      _parent: IResolverParent,
      _args: Record<string, unknown>,
      context: Context,
    ): Promise<AdminMetrics> => {
      requireAdmin(context);
      return await Admin.getMetrics();
    },

    adminUsers: async (
      _parent: IResolverParent,
      _args: Record<string, unknown>,
      context: Context,
    ): Promise<AdminUser[]> => {
      requireAdmin(context);
      return await Admin.getUsers();
    },

    adminWorkspaces: async (
      _parent: IResolverParent,
      _args: Record<string, unknown>,
      context: Context,
    ): Promise<AdminWorkspace[]> => {
      requireAdmin(context);
      return await Admin.getWorkspaces();
    },
  },

  Mutation: {
    setUserRole: async (
      _parent: IResolverParent,
      args: { _id: string; role: string },
      context: Context,
    ): Promise<IResponseMessage> => {
      requireAdmin(context);

      if (!["user", "admin"].includes(args.role)) {
        return { success: false, message: "Invalid role" };
      }

      const result = await Admin.setUserRole(args._id, args.role);
      if (result.success) {
        audit("admin.role_changed", context.user, { targetUserId: args._id, role: args.role });
      }
      return result;
    },

    setUserFeatures: async (
      _parent: IResolverParent,
      args: { _id: string; features: Partial<UserFeatures> },
      context: Context,
    ): Promise<IResponseMessage> => {
      requireAdmin(context);
      const result = await Admin.setUserFeatures(args._id, args.features);
      if (result.success) {
        audit("admin.features_changed", context.user, { targetUserId: args._id });
      }
      return result;
    },

    setBanStatus: async (
      _parent: IResolverParent,
      args: { _id: string; banned: boolean },
      context: Context,
    ): Promise<IResponseMessage> => {
      requireAdmin(context);

      if (context.user === args._id) {
        return { success: false, message: "You cannot ban your own account" };
      }

      const result = await Admin.setBanStatus(args._id, args.banned);
      if (result.success) {
        audit("admin.ban_changed", context.user, { targetUserId: args._id, banned: args.banned });
      }
      return result;
    },
  },
};
