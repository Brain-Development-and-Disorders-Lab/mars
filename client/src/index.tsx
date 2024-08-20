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
import { API_URL } from "./variables";

// Application
import App from "./App";
import { getToken } from "./util";
import { TOKEN_KEY } from "./variables";

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
      workspace: getToken(TOKEN_KEY).workspace,
    },
  };
});

const client = new ApolloClient({
  link: ApolloLink.from([authLink, httpLink as unknown as ApolloLink]),
  cache: new InMemoryCache({ addTypename: false }),
});

// Render the application
const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
);
