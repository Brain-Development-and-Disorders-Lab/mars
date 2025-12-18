// Models
import { Authentication } from "@models/Authentication";

// Custom types
import { IAuth, IResolverParent, ResponseData } from "@types";

export const AuthenticationResolvers = {
  Query: {
    // Perform login operation
    login: async (
      _parent: IResolverParent,
      args: { code: string },
    ): Promise<ResponseData<IAuth>> => {
      return await Authentication.login(args.code);
    },
  },
};
