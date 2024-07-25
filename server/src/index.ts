// .env configuration
import "dotenv/config";

// Libraries
import _ from "lodash";
import consola, { LogLevels } from "consola";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import http from "http";
import * as fs from "fs";
import "source-map-support/register";

// Get the connection functions
import { connectPrimary, connectSystem } from "./connectors/database";

// GraphQL
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { typedefs } from "./typedefs";
import { ActivityResolvers } from "./resolvers/Activity";
import { AttributesResolvers } from "./resolvers/Attributes";
import { AuthenticationResolvers } from "./resolvers/Authentication";
import { DataResolvers } from "./resolvers/Data";
import { DateResolver } from "./resolvers/Date";
import { EntitiesResolvers } from "./resolvers/Entities";
import { ProjectsResolvers } from "./resolvers/Projects";
import { UsersResolvers } from "./resolvers/Users";
import { Context } from "@types";

// GraphQL uploads
import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";

// Set logging level
consola.level =
  process.env.NODE_ENV !== "production" ? LogLevels.trace : LogLevels.info;

const port = process.env.PORT || 8000;
const app = express();
const httpServer = http.createServer(app);

// Start the GraphQL server
const startServer = async () => {
  consola.info("Server mode:", process.env.NODE_ENV);
  if (process.env.NODE_ENV !== "production") {
    consola.warn("Server not secured!");
  }

  // Perform database connections
  try {
    await connectPrimary();
    await connectSystem();
  } catch {
    consola.error("Error connecting to databases, aborting server start...");
    return;
  }

  // Create folder for serving static files
  if (!fs.existsSync("./static")) {
    fs.mkdirSync("./static");
  }

  // Setup the GraphQL server
  const server = new ApolloServer({
    typeDefs: typedefs,
    resolvers: [
      {
        Upload: GraphQLUpload,
      },
      ActivityResolvers,
      AttributesResolvers,
      AuthenticationResolvers,
      DataResolvers,
      DateResolver,
      EntitiesResolvers,
      ProjectsResolvers,
      UsersResolvers,
    ],
    introspection: process.env.NODE_ENV !== "production",
    csrfPrevention: true,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });
  await server.start();

  // Configure Express, enable CORS middleware
  const origins =
    process.env.NODE_ENV !== "production"
      ? ["http://localhost:8080"]
      : ["https://app.storacuity.com"];
  app.use(
    "/",
    cors<cors.CorsRequest>({ origin: origins }),
    express.json({ limit: "50mb" }),
    graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }),
    expressMiddleware(server, {
      context: async ({ req }): Promise<Context> => {
        return {
          user: req.headers.user as string,
        };
      },
    }),
    helmet(),
  );

  // Serve static resources
  app.use(
    "/static",
    cors<cors.CorsRequest>(),
    express.static("./static"),
    helmet(),
  );

  // Start the server
  httpServer.listen({ port: port });
  consola.success(`Server running at http://localhost:${port}/`);
};

startServer();
