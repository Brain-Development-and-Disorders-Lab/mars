// React imports
import React from "react";
import { createRoot } from "react-dom/client";

// Components
import { toaster } from "src/components/Toast";

// Apollo imports
import { ApolloClient, InMemoryCache, ApolloLink } from "@apollo/client";
import { ErrorLink } from "@apollo/client/link/error";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { ApolloProvider } from "@apollo/client/react";
import UploadHttpLink from "apollo-upload-client/UploadHttpLink.mjs";

// Posthog
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

posthog.init(process.env.REACT_APP_PUBLIC_POSTHOG_KEY as string, {
  api_host: process.env.REACT_APP_PUBLIC_POSTHOG_HOST,
  person_profiles: "always",
  loaded: (ph) => {
    if (process.env.DISABLE_CAPTURE === "true") {
      // Disable capture when in "development" mode
      ph.opt_out_capturing();
      ph.set_config({ disable_session_recording: true });

      // Display warning
      consola.warn("Logging and session capture is disabled");
    }
  },
});

// Variables
import { API_URL, SESSION_KEY, TOKEN_KEY } from "./variables";

// Utilities
import { getSession, getToken } from "./util";
import consola from "consola";

// Application
import App from "./App";

// Setup Apollo client
const httpLink = new UploadHttpLink({
  uri: API_URL,
  headers: {
    "Apollo-Require-Preflight": "true",
  },
});

/**
 * Authentication link to add headers to each request
 */
const authLink = new ApolloLink((operation, forward) => {
  const token = getToken(TOKEN_KEY);
  const session = getSession(SESSION_KEY);

  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      user: token.orcid,
      token: token.token,
      workspace: session.workspace,
    },
  }));

  return forward(operation);
});

/**
 * Extract error message and name from various error formats
 * Handles Error objects, strings, or other types
 */
const parseError = (error: unknown): { message: string; name: string } => {
  if (error instanceof Error) {
    return { message: error.message || "", name: error.name || "" };
  }
  if (typeof error === "string") {
    return { message: error, name: "" };
  }
  if (error && typeof error === "object" && "message" in error) {
    return {
      message: String(error.message || ""),
      name: String((error as { name?: string }).name || ""),
    };
  }

  // Default to empty string if error is not an object or string
  return { message: String(error || ""), name: "" };
};

/**
 * Check if an error is an abort error (expected when queries are cancelled)
 */
const isAbortError = (message: string, name: string): boolean => {
  return (
    message.includes("aborted") ||
    message.includes("Abort") ||
    name === "AbortError" ||
    message === "The operation was aborted."
  );
};

/**
 * Error handling for GraphQL errors that occur throughout the application
 */
const errorLink = new ErrorLink(({ error }) => {
  const { message: errorMessage, name: errorName } = parseError(error);

  // Handle GraphQL errors
  if (CombinedGraphQLErrors.is(error)) {
    for (const err of error.errors) {
      const errorMessage = err.message;

      // Handle authentication errors
      if (errorMessage === "Could not validate token") {
        toaster.create({
          title: "Authentication Error",
          description: "Unable to authenticate user. Please log in again.",
          type: "error",
          closable: false,
          action: {
            label: "Login",
            onClick: () => {
              // Navigate to the login page
              window.location.href = "/login";
            },
          },
        });

        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(SESSION_KEY);
        return;
      }
    }
  } else {
    if (isAbortError(errorMessage, errorName)) {
      return;
    }
    consola.error("Network or other error:", error);
  }
});

const client = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Workspace: {
        keyFields: ["_id"],
      },
      Entity: {
        keyFields: ["_id"],
      },
      Project: {
        keyFields: ["_id"],
      },
      Attribute: {
        keyFields: ["_id"],
      },
      Activity: {
        keyFields: ["_id"],
      },
    },
  }),
});

// Override console.error to filter out specifc or expected errors
const consoleError = console.error;
console.error = (...args: unknown[]) => {
  const { message, name } = parseError(args[0]);
  if (!isAbortError(message, name)) {
    consoleError.apply(console, args);
  }
};

// Global error handler to catch unhandled errors
window.addEventListener("error", (event) => {
  const { message } = parseError(event);
  if (isAbortError(message, "")) {
    event.preventDefault();
  }
});
window.addEventListener("unhandledrejection", (event) => {
  const { message, name } = parseError(event.reason);
  if (isAbortError(message, name)) {
    event.preventDefault();
    event.stopImmediatePropagation?.();
  }
});

// Render the application
const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <ApolloProvider client={client}>
    <PostHogProvider client={posthog}>
      <App />
    </PostHogProvider>
  </ApolloProvider>,
);
