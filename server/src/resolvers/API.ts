// Models
import { API } from "src/models/API";
import { Authentication } from "src/models/Authentication";
import { Users } from "src/models/Users";

// Custom types
import { APIKey, Context, ResponseData } from "@types";

export const APIResolvers = {
  Query: {
    // Generate a new API key
    generateKey: async (
      _parent: any,
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
};
