// Models
import { API } from "@models/API";
import { User } from "@models/User";

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
      const response = await API.generateKey(args.scope, args.workspaces);

      // Add the API key to the User
      await User.addKey(context.user, response.data);

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
      // Remove the API key from the User
      const response = await User.removeKey(context.user, args.key);

      return response;
    },
  },
};
