import { AdminMetrics, AdminUser, AdminWorkspace, Context, IResolverParent, IResponseMessage } from "@types";
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
