// Models
import { API } from "@models/API";
import { Authentication } from "@models/Authentication";
import { Users } from "@models/Users";

// Custom types
import {
  APIKey,
  Context,
  IResolverParent,
  IResponseMessage,
  ResponseData,
} from "@types";

export const APIResolvers = {
  Query: {
    // Generate a new API key
    generateKey: async (
      _parent: IResolverParent,
      args: { scope: "edit" | "view"; workspaces: string[] },
      context: Context,
    ): Promise<ResponseData<APIKey>> => {
      // Authenticate the provided context
      await Authentication.authenticate(context);
      const response = await API.generateKey(args.scope, args.workspaces);

      // Add the API key to the User
      await Users.addKey(context.user, response.data);

      // Return the generated API key
      return response;
    },
  },

  Mutation: {
    // Generate a new API key
    revokeKey: async (
      _parent: IResolverParent,
      args: { key: string },
      context: Context,
    ): Promise<IResponseMessage> => {
      // Authenticate the provided context
      await Authentication.authenticate(context);

      // Remove the API key from the User
      const response = await Users.removeKey(context.user, args.key);

      return response;
    },
  },
};
