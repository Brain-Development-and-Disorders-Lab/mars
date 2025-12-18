// better-auth imports
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

// Database types
import type { Db } from "mongodb";

/**
 * Create a Better Auth instance using an active MongoDB database connection.
 *
 * NOTE:
 * - The caller is responsible for ensuring that the database connection
 *   has already been established (i.e. `MongoClient.connect()` has completed).
 */
export const createAuth = (database: Db) =>
  betterAuth({
    database: mongodbAdapter(database),
    basePath: "/auth",
    emailAndPassword: {
      enabled: true,
    },
    user: {
      modelName: "user",
    },
  });
