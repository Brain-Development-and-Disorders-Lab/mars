// .env configuration
import "dotenv/config";

// Libraries
import _ from "lodash";
import consola, { LogLevels } from "consola";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import http from "http";
import "source-map-support/register";

const fileUpload = require("express-fileupload");

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
import { DateResolver } from "./resolvers/Date";
import { EntitiesResolvers } from "./resolvers/Entities";
import { ProjectsResolvers } from "./resolvers/Projects";
import { UsersResolvers } from "./resolvers/Users";
import { Context } from "@types";

// Set logging level
consola.level =
  process.env.NODE_ENV !== "production" ? LogLevels.trace : LogLevels.info;

// Start the GraphQL server
const startServer = async () => {
  consola.info("Server mode:", process.env.NODE_ENV);
  if (process.env.NODE_ENV !== "production") {
    consola.warn("Server not secured!");
  }

  const app = express();
  const httpServer = http.createServer(app);

  // Perform database connections
  try {
    await connectPrimary();
    await connectSystem();
  } catch {
    consola.error("Error connecting to databases, aborting server start...");
    return;
  }

  // Setup the GraphQL server
  const server = new ApolloServer({
    typeDefs: typedefs,
    resolvers: [
      ActivityResolvers,
      AttributesResolvers,
      AuthenticationResolvers,
      DateResolver,
      EntitiesResolvers,
      ProjectsResolvers,
      UsersResolvers,
    ],
    introspection: process.env.NODE_ENV !== "production",
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });
  await server.start();

  // Configure Express, enable CORS middleware
  app.use(
    "/mars",
    cors<cors.CorsRequest>(),
    express.json({ limit: "50mb" }),
    expressMiddleware(server, {
      context: async ({ req }): Promise<Context> => {
        return {
          user: req.headers.user as string,
        };
      },
    }),
    helmet(),
    fileUpload(),
  );

  // Start the server
  httpServer.listen({ port: 8000 });
  consola.success("Server running at http://localhost:8000/mars");
};

startServer();
