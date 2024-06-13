// React imports
import React from "react";
import { createRoot } from "react-dom/client";

// Apollo imports
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";

// Utility imports
import _ from "lodash";

// Variables
import { GRAPHQL_URL } from "./variables";

// Application
import App from "./App";

// Setup Apollo client
const client = new ApolloClient({
  uri: GRAPHQL_URL,
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
