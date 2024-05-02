import { Users } from "src/models/Users"

export const UsersResolvers = {
  Query: {
    // Retrieve all Users
    users: async () => await Users.all(),

    // Retrieve one User by _id
    user: async (_parent: any, args: { _id: string }) => {
      const users = await Users.all();
      return users.find((user) => user._id.toString() === args._id);
    },
  }
}
