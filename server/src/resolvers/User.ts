import { IResolverParent, IResponseMessage, ResponseData, UserModel } from "@types";

// Models
import { User } from "@models/User";

export const UserResolvers = {
  Query: {
    // Retrieve all Users
    users: async () => {
      return await User.all();
    },

    // Retrieve one User by _id
    user: async (_parent: IResolverParent, args: { _id: string }): Promise<UserModel | null> => {
      return await User.getOne(args._id);
    },

    // Retrieve one User by email
    userByEmail: async (_parent: IResolverParent, args: { email: string }): Promise<ResponseData<string>> => {
      return await User.getByEmail(args.email);
    },

    // Retrieve one User by ORCiD
    userByOrcid: async (_parent: IResolverParent, args: { orcid: string }): Promise<ResponseData<string>> => {
      return await User.getByOrcid(args.orcid);
    },
  },
  Mutation: {
    // Create a User
    createUser: async (_parent: IResolverParent, args: { user: UserModel }): Promise<IResponseMessage> => {
      return await User.create(args.user);
    },

    // Update a User
    updateUser: async (_parent: IResolverParent, args: { user: UserModel }): Promise<IResponseMessage> => {
      return await User.update(args.user);
    },
  },
};
