// React imports
import React from "react";
import { createRoot } from "react-dom/client";

// Components
import { toaster } from "src/components/Toast";

// Apollo imports
import { ApolloClient, InMemoryCache, ApolloLink } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { ErrorLink } from "@apollo/client/link/error";
import { SetContextLink } from "@apollo/client/link/context";
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
import { API_URL } from "./variables";

// Authentication
import { auth } from "@lib/auth";

// Hooks
import { useStorage } from "@hooks/useStorage";

// Utilities
import { isAbortError } from "@lib/util";
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
const authLink = new SetContextLink(async (previousContext, _operation) => {
  // Get session data
  const { data: sessionData } = await auth.getSession();

  // Get active Workspace
  const { storage } = useStorage();

  return {
    headers: {
      ...previousContext.headers,
      user: sessionData?.user.id,
      workspace: storage.workspace,
    },
  };
});

/**
 * Error handling for GraphQL errors that occur throughout the application
 */
const errorLink = new ErrorLink(({ error }) => {
  // Suppress AbortErrors - expected when Apollo Client cancels queries
  if (isAbortError(error)) {
    return;
  }

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

        return;
      }

      // Suppress "Workspace does not exist" errors - these are handled gracefully
      // in activateWorkspace when checking if a stored workspace exists
      if (errorMessage === "Workspace does not exist") {
        return;
      }
    }
  } else {
    // Network or other errors that aren't AbortErrors
    consola.error("Network or other error:", error);
  }
  // All code paths handled - implicit void return
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
  defaultOptions: {
    watchQuery: {
      errorPolicy: "all",
    },
    query: {
      errorPolicy: "all",
    },
    mutate: {
      errorPolicy: "all",
    },
  },
});

// Override console.error to filter out expected errors
// AbortErrors are expected when Apollo Client cancels queries and should not be logged
const consoleError = console.error;
console.error = (...args: unknown[]) => {
  const error = args[0];
  if (!isAbortError(error)) {
    consoleError.apply(console, args);
  }
};

// Global error handler to catch unhandled errors
// Prevents AbortErrors from bubbling up and triggering error overlays
window.addEventListener("error", (event) => {
  const error = event.error || event;
  if (isAbortError(error)) {
    event.preventDefault();
    event.stopImmediatePropagation?.();
  }
});

// Global unhandled rejection handler
// Prevents AbortErrors from unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  if (isAbortError(event.reason)) {
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
