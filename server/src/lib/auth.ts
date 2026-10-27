// Database imports
import { getDatabase, getClient } from "@connectors/database";

// better-auth imports
import { betterAuth } from "better-auth";
import { nanoid } from "nanoid";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { genericOAuth } from "better-auth/plugins";
import { admin } from "better-auth/plugins/admin";

// Models
import { User } from "@models/User";

// Email
import { sendEmail, emailTemplates } from "./email";

// Utility functions and libraries
import dayjs from "dayjs";

// Variables
import { DEFAULT_GLOBAL_PERMISSIONS } from "@models/Admin";

// Email domain assigned to ORCiD signups until their profile is completed
const ORCID_PLACEHOLDER_DOMAIN = "@orcid.placeholder";

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

      // Guard against both JSON null and the literal string "null"
      const given_name =
        typeof response.given_name === "string" && response.given_name !== "null" ? response.given_name : "";
      const family_name =
        typeof response.family_name === "string" && response.family_name !== "null" ? response.family_name : "";

      // Returning users are matched by their linked ORCiD account, so the email is only used on signup
      // better-auth requires an email, so use a placeholder until the profile is completed
      return {
        email: `${sub.replace(/\//g, "-")}${ORCID_PLACEHOLDER_DOMAIN}`,
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
  advanced: {
    database: {
      generateId: () => nanoid(),
    },
  },
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
        html: emailTemplates.resetPassword(user.name, url),
      });
    },
  },
  emailVerification: {
    sendOnSignUp: process.env.NODE_ENV === "production",
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your Metadatify email",
        html: emailTemplates.verifyEmail(user.name, url),
      });
    },
  },
  account: {
    accountLinking: {
      allowDifferentEmails: true,
      // ORCiD never reports a verified email, so it must be trusted for explicit linking from the profile page
      trustedProviders: ["orcid"],
      // Only link through the explicit flow, never by matching emails on sign-in
      disableImplicitLinking: true,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  rateLimit: {
    customRules: {
      // Read-only and polled frequently by the client
      "/get-session": { window: 60, max: 300 },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Server-only fields, email signups are complete while ORCiD signups still need profile details
          return {
            data: {
              ...user,
              lastLogin: dayjs(Date.now()).toISOString(),
              completedProfile: !user.email.endsWith(ORCID_PLACEHOLDER_DOMAIN),
            },
          };
        },
      },
    },
    account: {
      create: {
        after: async (account) => {
          // Record the ORCiD iD from the verified account on signup and on linking
          if (account.providerId === "orcid") {
            await User.setOrcid(account.userId, account.accountId);
          }
        },
      },
    },
  },
  plugins: [
    genericOAuth({
      config: [getOAuthConfig()],
    }),
    admin(),
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
        input: false,
      },
      hasSeenWalkthrough: {
        type: "boolean",
        defaultValue: false,
      },
      api_keys: {
        type: "string",
        defaultValue: "[]",
        input: false,
      },
      account_orcid: {
        type: "string",
        defaultValue: "",
        input: false,
      },
      completedProfile: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
      permissions: {
        type: "json",
        defaultValue: DEFAULT_GLOBAL_PERMISSIONS,
        input: false,
      },
    },
  },
});
