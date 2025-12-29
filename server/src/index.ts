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

// GraphQL
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { typedefs } from "./typedefs";

// Resolvers
import { APIResolvers } from "@resolvers/API";
import { ActivityResolvers } from "@resolvers/Activity";
import { CountersResolvers } from "@resolvers/Counters";
import { DataResolvers } from "@resolvers/Data";
import { DateResolver } from "@resolvers/Date";
import { EntitiesResolvers } from "@resolvers/Entities";
import { ObjectResolver } from "@resolvers/Object";
import { ProjectsResolvers } from "@resolvers/Projects";
import { SearchResolvers } from "@resolvers/Search";
import { TemplatesResolvers } from "@resolvers/Templates";
import { UserResolvers } from "@resolvers/User";
import { WorkspacesResolvers } from "@resolvers/Workspaces";

// Database
import { connect } from "@connectors/database";

// Authentication
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";

// Custom types
import { Context } from "@types";

// GraphQL uploads
import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";

// Public REST API routers
import APIRouter from "@models/API";

// Set logging level
consola.level =
  process.env.NODE_ENV === "development" ? LogLevels.verbose : LogLevels.info;

// Posthog
import { PostHog } from "posthog-node";
export const PostHogClient =
  process.env.DISABLE_CAPTURE !== "true"
    ? new PostHog(process.env.POSTHOG_KEY as string, {
        host: "https://us.i.posthog.com",
      })
    : undefined;

const port = process.env.PORT || 8000;
const app = express();

// Setup CORS origins
const origins =
  process.env.NODE_ENV !== "production"
    ? ["http://localhost:8080"]
    : ["https://app.metadatify.com"];

// Specify non-secure paths
const nonSecurePaths = ["/login"];

// Start the GraphQL server
const start = async () => {
  consola.info("Environment:", process.env.NODE_ENV);
  if (process.env.NODE_ENV !== "production") {
    consola.warn("Server not secured!");
  }

  await connect();
  const { auth } = await import("@lib/auth");

  // Setup authentication helper function
  const checkSession: RequestHandler = async (req, res, next) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!_.includes(nonSecurePaths, req.path) && session === null) {
      res
        .status(401)
        .json({ message: `You do not have permission to access ${req.path}` });
    } else {
      next();
    }
  };

  // Configure authentication routes after the database connection is ready
  app.all(
    "/auth/{*any}",
    cors<cors.CorsRequest>({
      origin: origins,
      credentials: true,
    }),
    toNodeHandler(auth),
  );

  // Create folder for serving static files
  if (!fs.existsSync(__dirname + "/public")) {
    consola.info("Creating /public directory...");
    fs.mkdirSync(__dirname + "/public");
  }

  // Setup the GraphQL server
  const httpServer = http.createServer(app);
  const server = new ApolloServer<Context>({
    typeDefs: typedefs,
    resolvers: [
      {
        Upload: GraphQLUpload,
      },
      ActivityResolvers,
      APIResolvers,
      CountersResolvers,
      DataResolvers,
      DateResolver,
      EntitiesResolvers,
      ObjectResolver,
      ProjectsResolvers,
      SearchResolvers,
      TemplatesResolvers,
      UserResolvers,
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
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });
  consola.start("Starting GraphQL server...");
  await server.start();
  consola.success("GraphQL server running!");

  // Serve static resources
  app.use(
    "/static",
    cors<cors.CorsRequest>({
      origin: origins,
      credentials: true,
    }),
    express.static(__dirname + "/public"),
    helmet(),
  );

  // Open the public API endpoint
  app.use(
    "/v1",
    cors<cors.CorsRequest>({ origin: "*" }),
    express.json(),
    express.urlencoded({ extended: true }),
    APIRouter(),
    helmet(),
  );

  // Configure Express and GraphQL
  app.use(
    "/",
    cors<cors.CorsRequest>({
      origin: origins,
      credentials: true,
    }),
    checkSession,
    express.json({ limit: "100mb" }),
    graphqlUploadExpress({
      maxFileSize: 104857600, // 100MB
      maxFiles: 10,
    }) as unknown as RequestHandler,
    expressMiddleware(server, {
      context: async ({ req }): Promise<Context> => {
        // Extract values from headers and create Context value
        return {
          user: (req.headers.user as string) || "",
          workspace: (req.headers.workspace as string) || "",
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
