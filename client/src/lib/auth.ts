// better-auth imports
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields, adminClient } from "better-auth/client/plugins";
import { API_URL } from "@variables";

export const auth = createAuthClient({
  baseURL: API_URL,
  basePath: "/auth",
  plugins: [
    adminClient(),
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
          input: false,
        },
        hasSeenWalkthrough: {
          type: "boolean",
        },
        api_keys: {
          type: "string",
          input: false,
        },
        account_orcid: {
          type: "string",
          input: false,
        },
        completedProfile: {
          type: "boolean",
          input: false,
        },
        permissions: {
          type: "json",
          input: false,
        },
      },
    }),
  ],
});
