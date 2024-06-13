// .env configuration
import "dotenv/config";

// Libraries
import _ from "lodash";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import consola, { LogLevels } from "consola";
import "source-map-support/register";

const fileUpload = require("express-fileupload");

// Get the connection functions
import { connectPrimary, connectSystem } from "./connectors/database";

// Routes
import ActivityRoute from "./routes/Activity";
import AttributesRoute from "./routes/Attributes";
import AuthenticationRoute from "./routes/Authentication";
import DataRoute from "./routes/Data";
import EntitiesRoute from "./routes/Entities";
import ProjectsRoute from "./routes/Projects";
import SearchRoute from "./routes/Search";
import SystemRoute from "./routes/System";
import UsersRoute from "./routes/Users";

// GraphQL
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typedefs } from "./typedefs";

// GraphQL - resolvers
import { AttributesResolvers } from "./resolvers/Attributes";
import { ActivityResolvers } from "./resolvers/Activity";
import { DateResolver } from "./resolvers/Date";
import { EntitiesResolvers } from "./resolvers/Entities";
import { ProjectsResolvers } from "./resolvers/Projects";
import { UsersResolvers } from "./resolvers/Users";

// GraphQL - authentication
import { graphqlAuthenticationWrapper } from "./middleware/Authentication";

// Set logging level
consola.level =
  process.env.NODE_ENV !== "production" ? LogLevels.trace : LogLevels.info;

consola.info("Server mode:", process.env.NODE_ENV);
if (process.env.NODE_ENV !== "production") {
  consola.warn("Server not secured!");
}

export const app = express();
// Define the set of ports and REST API endpoint
const ports = {
  rest: process.env.REST_PORT ? parseInt(process.env.REST_PORT) : 8000,
  graphql: process.env.GRAPHQL_PORT ? parseInt(process.env.GRAPHQL_PORT) : 8001,
};
const endpoint = "/mars";

// Configure Express, enable CORS middleware and routes
app.use(helmet());
app.use(cors({ credentials: true, origin: true }));
app.use(express.json({ limit: "50mb" }));
app.use(fileUpload());

// Use routes
app.use(ProjectsRoute); // ProjectsRoute now has authenticationMiddleware applied to it
app.use(ActivityRoute);
app.use(AttributesRoute);
app.use(AuthenticationRoute);
app.use(DataRoute);
app.use(EntitiesRoute);
app.use(SearchRoute);
app.use(SystemRoute);
app.use(UsersRoute);

const wrapper = express();
wrapper.use(endpoint, app);

// Start the Express REST API server
wrapper.listen(ports.rest, () => {
  // Connect to the primary database when the server starts
  connectPrimary().then(() => {
    // Connect to the system database
    connectSystem().then(() => {
      consola.success("REST endpoint:", endpoint, ports.rest);
    });
  });
});

// Start the GraphQL server
const startServer = async () => {
  const server = new ApolloServer({
    typeDefs: typedefs,
    resolvers: [
      DateResolver,
      UsersResolvers,
      ProjectsResolvers,
      EntitiesResolvers,
      AttributesResolvers,
      ActivityResolvers,
    ],
    introspection: process.env.NODE_ENV !== "production",
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: ports.graphql },
    context: graphqlAuthenticationWrapper,
  });

  consola.success("GraphQL endpoint:", url);
};

startServer();
