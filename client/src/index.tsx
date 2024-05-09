// React imports
import React from "react";
import { createRoot } from "react-dom/client";

// Apollo imports
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';

// Logging
import { consola } from "consola";
consola.wrapConsole();

// Application
import App from "./App";

// Setup Apollo client
const client = new ApolloClient({
  uri: "http://localhost:4000/graphql",
  cache: new InMemoryCache(),
});

// Render the application
const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
);
