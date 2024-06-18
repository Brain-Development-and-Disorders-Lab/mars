import { Authentication } from "src/models/Authentication";

export const AuthenticationResolvers = {
  Query: {
    // Perform login operation
    login: async (_parent: any, args: { code: string }) => {
      return await Authentication.login(args.code);
    },
  },
};
