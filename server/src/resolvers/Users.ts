import { Users } from "src/models/Users"

export const UsersResolvers = {
  Query: {
    users: async () => await Users.all(),
  }
}
