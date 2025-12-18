// better-auth imports
import { createAuthClient } from "better-auth/react";

export const auth = createAuthClient({
  baseURL: "http://localhost:8000/",
  basePath: "/auth",
});
