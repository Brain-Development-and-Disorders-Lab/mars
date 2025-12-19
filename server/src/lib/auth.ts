// better-auth imports
import { getDatabase, getClient } from "@connectors/database";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

/**
 * Create a Better Auth instance using an active MongoDB database connection.
 */
export const auth = betterAuth({
  database: mongodbAdapter(getDatabase(), {
    client: getClient(),
  }),
  basePath: "/auth",
  emailAndPassword: {
    enabled: true,
  },
  user: {
    modelName: "user",
    additionalFields: {
      firstName: {
        type: "string",
      },
      lastName: {
        type: "string",
      },
      affiliation: {
        type: "string",
      },
      lastLogin: {
        type: "string",
      },
      workspaces: {
        type: "string[]",
      },
      api_keys: {
        type: "string[]",
      },
      account_orcid: {
        type: "string",
      },
    },
  },
});
