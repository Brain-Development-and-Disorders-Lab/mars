// src/middleware/Authentication.ts

import consola from "consola";
import { Authentication } from "../operations/Authentication";
import { GraphQLError } from "graphql";

// Custom types
import { UserModel } from "@types";

const validateToken = async (
  req: any,
): Promise<{ status: number; message: string; user: UserModel }> => {
  // If we are not in production, bypass validation
  if (process.env.NODE_ENV !== "production") {
    return {
      status: 200,
      message: "Authenticated successfully.",
      user: {
        _id: "XXXX-0000-DEMO-1111",
        name: "Test User",
        email: "mars@reusable.bio",
        token: "test_token_value",
      },
    };
  }

  // Extract the token from the request header
  const token = req.headers["id_token"]; // Bearer <token>
  if (!token) {
    return {
      status: 401,
      message: "No token provided.",
      user: {} as UserModel,
    };
  }

  // Validate the token
  let user: UserModel;
  try {
    user = await Authentication.validate(token);
  } catch {
    return {
      status: 401,
      message: "Invalid or expired token.",
      user: {} as UserModel,
    };
  }

  // If token is valid, you might want to fetch user details or permissions
  // and attach them to the request object for further use in the endpoint logic
  // e.g., req.user = userDetails;
  req.user = user;

  return {
    status: 200,
    message: "Authenticated successfully.",
    user: user,
  };
};

const restAuthenticationWrapper = async (req: any, res: any, next: any) => {
  try {
    const result = await validateToken(req);
    if (result.status !== 200) {
      return res.status(result.status).json({ message: result.message });
    }

    // If token is valid, you might want to fetch user details or permissions
    // and attach them to the request object for further use in the endpoint logic
    // e.g., req.user = userDetails;
    req.user = result.user;

    // Proceed to the next middleware/function in the stack
    next();
  } catch (error) {
    consola.error("REST authentication middleware error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const graphqlAuthenticationWrapper = async (
  req: any,
): Promise<{ user: UserModel }> => {
  const result = await validateToken(req);
  if (result.status !== 200) {
    throw new GraphQLError("User is not authenticated", {
      extensions: {
        code: "UNAUTHENTICATED",
        http: {
          status: 401,
        },
      },
    });
  }

  // If token is valid, you might want to fetch user details or permissions
  // and attach them to the request object for further use in the endpoint logic
  // e.g., req.user = userDetails;
  const user = result.user;
  req.user = user;

  return { user };
};

export { restAuthenticationWrapper, graphqlAuthenticationWrapper };
