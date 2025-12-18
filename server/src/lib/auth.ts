// better-auth imports
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

// Database imports
import { getDatabase } from "../connectors/database";

const auth = betterAuth({
  database: mongodbAdapter(getDatabase()),
});

export default auth;
