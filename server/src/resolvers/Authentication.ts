// Models
import { Authentication } from "src/models/Authentication";

// Custom types
import { IAuth } from "@types";

export const AuthenticationResolvers = {
  Query: {
    // Perform login operation
    login: async (_parent: any, args: { code: string }): Promise<IAuth> => {
      return await Authentication.login(args.code);
    },
  },
};
