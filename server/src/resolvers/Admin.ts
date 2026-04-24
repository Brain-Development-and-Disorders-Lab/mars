import { AdminMetrics, AdminUser, Context, IResolverParent, IResponseMessage, UserFeatures } from "@types";
import { GraphQLError } from "graphql/index";

// Models
import { Admin } from "@models/Admin";

const requireAdmin = (context: Context) => {
  if (context.userRole !== "admin") {
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

      return await Admin.setUserRole(args._id, args.role);
    },

    setUserFeatures: async (
      _parent: IResolverParent,
      args: { _id: string; ai?: boolean },
      context: Context,
    ): Promise<IResponseMessage> => {
      requireAdmin(context);
      return await Admin.setUserFeatures(args._id, { ai: args.ai });
    },
  },
};
