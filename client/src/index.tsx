// React imports
import React from "react";
import { createRoot } from "react-dom/client";

// Apollo imports
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

// Utility imports
import _ from "lodash";

// Variables
import { API_URL } from "./variables";

// Application
import App from "./App";
import { getToken } from "./util";
import { TOKEN_KEY } from "./variables";

// Setup Apollo client
const httpLink = createHttpLink({
  uri: API_URL,
});

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      token: getToken(TOKEN_KEY),
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
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
