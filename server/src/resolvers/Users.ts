import { Users } from "src/models/Users";

export const UsersResolvers = {
  Query: {
    // Retrieve all Users
    users: async () => await Users.all(),

    // Retrieve one User by _id
    user: async (_parent: any, args: { _id: string }) => {
      return await Users.getOne(args._id);
    },
  },
};
