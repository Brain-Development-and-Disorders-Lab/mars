// Models
import { Authentication } from "src/models/Authentication";

// Custom types
import { IAuth, ResponseData } from "@types";

export const AuthenticationResolvers = {
  Query: {
    // Perform login operation
    login: async (
      _parent: any,
      args: { code: string },
    ): Promise<ResponseData<IAuth>> => {
      return await Authentication.login(args.code);
    },
  },
};
