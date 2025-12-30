// better-auth imports
import { getDatabase, getClient } from "@connectors/database";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { genericOAuth } from "better-auth/plugins";

/**
 * Get ORCiD OAuth configuration based on environment
 */
const getOAuthConfig = () => {
  // ORCiD client ID and secret from `.env`
  const clientId = process.env.ORCID_CLIENT_ID;
  const clientSecret = process.env.ORCID_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "ORCiD OAuth configuration is missing. Please set ORCID_CLIENT_ID and ORCID_CLIENT_SECRET environment variables.",
    );
  }

  return {
    providerId: "orcid",
    clientId,
    clientSecret,
    authorizationUrl: "https://orcid.org/oauth/authorize",
    tokenUrl: "https://orcid.org/oauth/token",
    userInfoUrl: "https://orcid.org/oauth/userinfo",
    scopes: ["/authenticate", "/read-limited"],
    mapProfileToUser: async (response) => {
      return {
        account_orcid: response.orcid || "",
        email: response.email || "",
      };
    },
  };
};

/**
 * Get trusted origins for OAuth callbacks
 */
const getTrustedOrigins = () => {
  if (process.env.NODE_ENV === "production") {
    return ["https://app.metadatify.com"];
  }
  return ["http://localhost:8080", "http://127.0.0.1:8080"];
};

/**
 * Create a Better Auth instance using an active MongoDB database connection.
 */
export const auth = betterAuth({
  database: mongodbAdapter(getDatabase(), {
    client: getClient(),
  }),
  basePath: "/auth",
  baseURL:
    process.env.NODE_ENV === "production"
      ? "https://api.metadatify.com"
      : "http://localhost:8000",
  trustedOrigins: getTrustedOrigins(),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    genericOAuth({
      config: [getOAuthConfig()],
    }),
  ],
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
