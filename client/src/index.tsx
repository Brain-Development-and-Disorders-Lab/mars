// React imports
import React from "react";
import { createRoot } from "react-dom/client";

// Apollo imports
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  ApolloLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";

// Utility imports
import _ from "lodash";

// Variables
import { API_URL, SESSION_KEY, TOKEN_KEY } from "./variables";

// Application
import App from "./App";
import { getSession, getToken } from "./util";

// Setup Apollo client
const httpLink = createUploadLink({
  uri: API_URL,
  headers: {
    "Apollo-Require-Preflight": "true",
  },
});

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      user: getToken(TOKEN_KEY).orcid,
      token: getToken(TOKEN_KEY).token,
      workspace: getSession(SESSION_KEY).workspace,
    },
  };
});

const client = new ApolloClient({
  link: ApolloLink.from([authLink, httpLink as unknown as ApolloLink]),
  cache: new InMemoryCache({
    addTypename: false,
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
    <App />
  </ApolloProvider>,
);
