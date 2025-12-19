// better-auth imports
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const auth = createAuthClient({
  baseURL: "http://localhost:8000/",
  basePath: "/auth",
  plugins: [
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
