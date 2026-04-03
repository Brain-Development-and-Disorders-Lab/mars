// Database imports
import { getDatabase, getClient } from "@connectors/database";

// better-auth imports
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { genericOAuth } from "better-auth/plugins";

// Models
import { User } from "@models/User";

// Email
import { sendEmail, templates } from "./email";

/**
 * Get ORCiD OAuth configuration based on environment
 */
const getOAuthConfig = () => {
  // Get ORCiD API application ID and secret
  const isDevelopment = process.env.NODE_ENV === "development";
  const clientId = isDevelopment ? process.env.ORCID_SANDBOX_CLIENT_ID : process.env.ORCID_PRODUCTION_CLIENT_ID;
  const clientSecret = isDevelopment
    ? process.env.ORCID_SANDBOX_CLIENT_SECRET
    : process.env.ORCID_PRODUCTION_CLIENT_SECRET;

  // Catch any configuration issues
  if (!clientId || !clientSecret) {
    throw new Error(
      `ORCiD OAuth configuration is missing. Please set ${isDevelopment ? "ORCID_SANDBOX_" : "ORCID_PRODUCTION_"}CLIENT_ID and ${isDevelopment ? "ORCID_SANDBOX_" : "ORCID_PRODUCTION_"}CLIENT_SECRET environment variables.`,
    );
  }

  // Use sandbox endpoints in development, production endpoints otherwise
  const baseUrl = isDevelopment ? "https://sandbox.orcid.org" : "https://orcid.org";

  return {
    providerId: "orcid",
    clientId,
    clientSecret,
    authorizationUrl: `${baseUrl}/oauth/authorize`,
    tokenUrl: `${baseUrl}/oauth/token`,
    userInfoUrl: `${baseUrl}/oauth/userinfo`,
    scopes: ["openid"],
    mapProfileToUser: async (response: Record<string, unknown>) => {
      // ORCiD userinfo endpoint returns 'sub' as the ORCiD ID per OpenID Connect spec
      const sub = typeof response.sub === "string" ? response.sub : "";
      const given_name = typeof response.given_name === "string" ? response.given_name : "";
      const family_name = typeof response.family_name === "string" ? response.family_name : "";

      // Note: Returning ORCiD user, look up their real email so better-auth can
      // match the session correctly
      const userIdResult = await User.getByOrcid(sub);
      if (userIdResult.success) {
        const existingUser = await User.getOne(userIdResult.data);
        return {
          account_orcid: sub,
          email: existingUser?.email,
          emailVerified: true,
          name: `${given_name} ${family_name}`.trim(),
        };
      }

      // Note: New user or first-time link, better-auth requires an email, so use a
      // placeholder
      return {
        account_orcid: sub,
        email: `${sub.replace(/\//g, "-")}@orcid.placeholder`,
        emailVerified: false,
        name: `${given_name} ${family_name}`.trim(),
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
  return ["http://127.0.0.1:8080"];
};

/**
 * Create a Better Auth instance using an active MongoDB database connection.
 */
export const auth = betterAuth({
  database: mongodbAdapter(getDatabase(), {
    client: getClient(),
    transaction: false,
  }),
  basePath: "/auth",
  baseURL: process.env.NODE_ENV === "production" ? "https://api.metadatify.com" : "http://127.0.0.1:8000",
  trustedOrigins: getTrustedOrigins(),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your Metadatify password",
        html: templates.resetPassword(user.name, url),
      });
    },
  },
  emailVerification: {
    sendOnSignUp: process.env.NODE_ENV === "production",
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your Metadatify email",
        html: templates.verifyEmail(user.name, url),
      });
    },
  },
  account: {
    accountLinking: {
      allowDifferentEmails: true,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  plugins: [
    genericOAuth({
      config: [getOAuthConfig()],
    }),
  ],
  user: {
    modelName: "user",
    deleteUser: {
      enabled: true,
    },
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
      api_keys: {
        type: "string[]",
      },
      account_orcid: {
        type: "string",
      },
    },
  },
});
