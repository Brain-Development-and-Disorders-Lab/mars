import { Context, IResolverParent, IResponseMessage, UserModel } from "@types";

// Models
import { Authentication } from "src/models/Authentication";
import { Users } from "src/models/Users";

export const UsersResolvers = {
  Query: {
    // Retrieve all Users
    users: async (
      _parent: IResolverParent,
      _args: Record<string, unknown>,
      context: Context,
    ) => {
      // Authenticate the provided context
      await Authentication.authenticate(context);

      return await Users.all();
    },

    // Retrieve one User by _id
    user: async (
      _parent: IResolverParent,
      args: { _id: string },
      context: Context,
    ) => {
      // Authenticate the provided context
      await Authentication.authenticate(context);

      return await Users.getOne(args._id);
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

      return await Users.create(args.user);
    },

    // Update a User
    updateUser: async (
      _parent: IResolverParent,
      args: { user: UserModel },
      context: Context,
    ): Promise<IResponseMessage> => {
      // Authenticate the provided context
      await Authentication.authenticate(context);

      return await Users.update(args.user);
    },
  },
};
