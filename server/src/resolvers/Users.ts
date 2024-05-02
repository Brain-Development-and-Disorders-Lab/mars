import { Users } from "src/models/Users"

export const UsersResolvers = {
  Query: {
    // Retrieve all Users
    users: async () => await Users.all(),
    // Retrieve one User by _id
    user: async (_: any, { _id }: any) => {
      const users = await Users.all();
      return users.find((u) => u._id === _id);
    },
  }
}
