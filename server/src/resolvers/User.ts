import { Context, IResolverParent, IResponseMessage, UserModel } from "@types";

// Models
import { Authentication } from "@models/Authentication";
import { User } from "@models/User";

export const UserResolvers = {
  Query: {
    // Retrieve all Users
    users: async (
      _parent: IResolverParent,
      _args: Record<string, unknown>,
      context: Context,
    ) => {
      // Authenticate the provided context
      await Authentication.authenticate(context);

      return await User.all();
    },

    // Retrieve one User by _id
    user: async (
      _parent: IResolverParent,
      args: { _id: string },
      context: Context,
    ) => {
      // Authenticate the provided context
      await Authentication.authenticate(context);

      return await User.getOne(args._id);
    },
  },
  Mutation: {
    // Create a User
    createUser: async (
      _parent: IResolverParent,
      args: { user: UserModel },
      context: Context,
    ) => {
      // Authenticate the provided context
      await Authentication.authenticate(context);

      return await User.create(args.user);
    },

    // Update a User
    updateUser: async (
      _parent: IResolverParent,
      args: { user: UserModel },
      context: Context,
    ): Promise<IResponseMessage> => {
      // Authenticate the provided context
      await Authentication.authenticate(context);

      return await User.update(args.user);
    },
  },
};
