// better-auth imports
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { genericOAuthClient } from "better-auth/client/plugins";
import { API_URL } from "../variables";

export const auth = createAuthClient({
  baseURL: API_URL,
  basePath: "/auth",
  plugins: [
    genericOAuthClient(),
    inferAdditionalFields({
      user: {
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
    }),
  ],
});
