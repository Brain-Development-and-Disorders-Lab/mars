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
import _ from "lodash";

// Monitoring
import { collectDefaultMetrics, register } from "prom-client";
import { Metrics } from "./models/Metrics";
import { createPrometheusExporterPlugin } from "@bmatei/apollo-prometheus-exporter";

// Get the connection functions
import { connect } from "./connectors/database";

// GraphQL
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { typedefs } from "./typedefs";

// Resolvers
import { APIResolvers } from "./resolvers/API";
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

// Custom types
import { Context } from "@types";

// GraphQL uploads
import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";

// Public REST API routers
import APIRouter from "./models/API";

// Set logging level
consola.level =
  process.env.NODE_ENV === "development" ? LogLevels.verbose : LogLevels.info;

// Prometheus
collectDefaultMetrics();

const port = process.env.PORT || 8000;
const app = express();
const prometheusExporterPlugin = createPrometheusExporterPlugin({
  app,
  defaultMetrics: false,
});
const httpServer = http.createServer(app);

// Setup CORS origins
const origins =
  process.env.NODE_ENV !== "production"
    ? ["http://localhost:8080"]
    : ["https://app.metadatify.com"];

// Start the GraphQL server
const start = async () => {
  consola.info("Environment:", process.env.NODE_ENV);
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
  if (!fs.existsSync(__dirname + "/public")) {
    consola.info("Creating /public directory...");
    fs.mkdirSync(__dirname + "/public");
  }

  // Setup server Prometheus
  Metrics.setupPrometheus();

  // Setup the GraphQL server
  const server = new ApolloServer<Context>({
    typeDefs: typedefs,
    resolvers: [
      {
        Upload: GraphQLUpload,
      },
      ActivityResolvers,
      APIResolvers,
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
      {
        SearchResult: {
          __resolveType(result: any) {
            // Entity identifiers start with "e"
            if (_.startsWith(result._id, "e")) {
              return "Entity";
            }

            // Project identifiers start with "p"
            if (_.startsWith(result._id, "p")) {
              return "Project";
            }

            return null;
          },
        },
      },
    ],
    introspection: process.env.NODE_ENV !== "production",
    csrfPrevention: true,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      prometheusExporterPlugin,
    ],
  });
  consola.start("Starting GraphQL server...");
  await server.start();
  consola.success("GraphQL server running!");

  // Serve Prometheus metrics
  app.get("/metrics", async (_req, res) => {
    try {
      res.set("Content-Type", register.contentType);
      res.end(await register.metrics());
    } catch (err) {
      res.status(500).end(err);
    }
  });

  // Serve static resources
  app.use(
    "/static",
    cors<cors.CorsRequest>({ origin: origins }),
    express.static(__dirname + "/public"),
    helmet(),
  );

  // Open the public API endpoint
  app.use(
    "/v1",
    cors<cors.CorsRequest>({ origin: "*" }),
    APIRouter(),
    helmet(),
  );

  // Configure Express and GraphQL
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
        // Extract values from headers and create Context value
        return {
          user: (req.headers.user as string) || "",
          workspace: (req.headers.workspace as string) || "",
          token: (req.headers.token as string) || "",
        };
      },
    }),
    helmet(),
  );

  // Start the server
  consola.start("Starting Express server...");
  httpServer.listen({ port: port });
  consola.success(`Express server running at: http://localhost:${port}/`);
};

start();
