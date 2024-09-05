// .env configuration
import "dotenv/config";

// Libraries
import consola, { LogLevels } from "consola";
import cors from "cors";
import express, { RequestHandler } from "express";
import helmet from "helmet";
import http from "http";
import * as fs from "fs";
import "source-map-support/register";

// Get the connection functions
import { connect } from "./connectors/database";

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
import { ObjectResolver } from "./resolvers/Object";
import { ProjectsResolvers } from "./resolvers/Projects";
import { SearchResolvers } from "./resolvers/Search";
import { UsersResolvers } from "./resolvers/Users";
import { WorkspacesResolvers } from "./resolvers/Workspaces";
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
const start = async () => {
  consola.info("Server mode:", process.env.NODE_ENV);
  if (process.env.NODE_ENV !== "production") {
    consola.warn("Server not secured!");
  }

  // Perform database connections
  try {
    await connect();
  } catch {
    consola.error("Error connecting to databases, aborting server start...");
    return;
  }

  // Create folder for serving static files
  if (!fs.existsSync("./static")) {
    fs.mkdirSync("./static");
  }

  // Setup the GraphQL server
  const server = new ApolloServer<Context>({
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
      ObjectResolver,
      ProjectsResolvers,
      SearchResolvers,
      UsersResolvers,
      WorkspacesResolvers,
    ],
    introspection: process.env.NODE_ENV !== "production",
    csrfPrevention: true,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });
  await server.start();

  // Serve static resources, enable CORS middleware
  app.use(
    "/static",
    cors<cors.CorsRequest>(),
    express.static("./static"),
    helmet(),
  );

  // Configure Express, GraphQL, and enable CORS middleware
  const origins =
    process.env.NODE_ENV !== "production"
      ? ["http://localhost:8080"]
      : ["https://app.metadatify.com"];
  app.use(
    "/",
    cors<cors.CorsRequest>({ origin: origins }),
    express.json({ limit: "50mb" }),
    graphqlUploadExpress({
      maxFileSize: 10000000,
      maxFiles: 10,
    }) as RequestHandler,
    expressMiddleware(server, {
      context: async ({ req }): Promise<Context> => {
        return {
          user: req.headers.user as string,
          workspace: req.headers.workspace as string,
        };
      },
    }),
    helmet(),
  );

  // Start the server
  httpServer.listen({ port: port });
  consola.success(`Server running at: http://localhost:${port}/`);
};

start();
