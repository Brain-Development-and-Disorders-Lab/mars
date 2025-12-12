// React imports
import React from "react";
import { createRoot } from "react-dom/client";

// Components
import { toaster } from "src/components/Toast";

// Apollo imports
import { ApolloClient, InMemoryCache, ApolloLink } from "@apollo/client";
import { ErrorLink } from "@apollo/client/link/error";
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
 * Error handling for GraphQL errors that occur throughout the application
 */
const errorLink = new ErrorLink(({ error }) => {
  if (error.name === "CombinedGraphQLErrors" && "errors" in error) {
    const graphQLErrors = error.errors as Array<{ message: string }>;
    for (const err of graphQLErrors) {
      if (err.message === "Could not validate token") {
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
