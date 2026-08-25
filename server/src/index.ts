// .env configuration
import "dotenv/config";

// Libraries
import cors from "cors";
import express, { RequestHandler } from "express";
import helmet from "helmet";
import http from "http";
import * as fs from "fs";
import "source-map-support/register";
import _ from "lodash";

// GraphQL
import { ApolloServer, type ApolloServerPlugin, type GraphQLRequestContextWillSendResponse } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { GraphQLError } from "graphql/index";
import type { IResolvers } from "@graphql-tools/utils";
import { typedefs } from "./typedefs";

// Resolvers
import { AdminResolvers } from "@resolvers/Admin";
import { APIResolvers } from "@resolvers/API";
import { ActivityResolvers } from "@resolvers/Activity";
import { CountersResolvers } from "@resolvers/Counters";
import { DataResolvers } from "@resolvers/Data";
import { DateResolver } from "@resolvers/Date";
import { EntitiesResolvers } from "@resolvers/Entities";
import { IdentifiersResolvers } from "@resolvers/Identifiers";
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

// Logging and audit
import pinoHttp from "pino-http";
import { logger } from "@lib/logger";
import { audit } from "@lib/audit";

// Posthog
export { PostHogClient } from "@lib/posthog";

const port = process.env.PORT || 8000;
const app = express();

// Azure App Service middleware to strip `x-forwarded-for` port
app.use((req, _res, next) => {
  const xForwardedFor = req.headers["x-forwarded-for"];
  if (typeof xForwardedFor === "string") {
    req.headers["x-forwarded-for"] = xForwardedFor
      .split(",")
      .map((hop) => hop.trim().replace(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d+$/, "$1"))
      .join(", ");
  }
  next();
});

// Configure all HTTP logging
app.use(
  pinoHttp({
    logger,
    customProps: (_req, res) => ({
      userId: (res.locals.session?.user?.id as string) ?? undefined,
    }),
    autoLogging: { ignore: (req) => req.url === "/health" },
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    serializers: {
      req: (req) => ({ method: req.method, url: req.url, remoteAddress: req.remoteAddress }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  }),
);

// Setup CORS origins
const origins = process.env.NODE_ENV !== "production" ? ["http://127.0.0.1:8080"] : ["https://app.metadatify.com"];

// Start the GraphQL server
const start = async () => {
  logger.info({ env: process.env.NODE_ENV }, "Environment");
  if (process.env.NODE_ENV !== "production") {
    logger.warn("Server not secured!");
  }

  await connect();
  const { auth } = await import("@lib/auth");

  // Setup authentication helper function
  const checkSession: RequestHandler = async (req, res, next) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (session === null) {
      res.status(401).json({ message: `You do not have permission to access ${req.path}` });
    } else {
      res.locals.session = session;
      next();
    }
  };

  // Configure auth audit interceptors for auth logging
  app.post("/auth/sign-in/email", (req, res, next) => {
    res.on("finish", () => {
      audit(res.statusCode < 400 ? "auth.login.success" : "auth.login.failure", req.body?.email ?? "unknown", {
        method: "email",
        ip: req.ip,
      });
    });
    next();
  });

  app.post("/auth/sign-out", (_req, res, next) => {
    res.on("finish", () => {
      audit("auth.logout", (res.locals.session?.user?.id as string) ?? "anonymous", {});
    });
    next();
  });

  app.post("/auth/forget-password", (req, res, next) => {
    res.on("finish", () => {
      if (res.statusCode < 400) {
        audit("auth.password_reset_requested", req.body?.email ?? "unknown", {});
      }
    });
    next();
  });

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
    logger.info("Creating /public directory...");
    fs.mkdirSync(__dirname + "/public");
  }

  // Logging plugin for Apollo to surface GraphQL-level errors invisible to pino-http
  const loggingPlugin: ApolloServerPlugin<Context> = {
    async requestDidStart(requestContext) {
      return {
        async willSendResponse(responseContext: GraphQLRequestContextWillSendResponse<Context>) {
          const body = responseContext.response.body;
          if (body.kind !== "single") return;
          const errors = body.singleResult.errors;
          if (!errors?.length) return;
          for (const err of errors) {
            const code = err.extensions?.code;
            const userId = responseContext.contextValue?.user;
            const operationName = requestContext.request.operationName ?? undefined;
            if (code === "FORBIDDEN" || code === "UNAUTHORIZED") {
              logger.warn({ userId, operationName, errorCode: code }, "GraphQL permission denied");
              audit("permission.denied", userId ?? "anonymous", {
                gqlOperation: operationName,
                errorCode: String(code),
              });
            } else {
              logger.error({ userId, operationName, errorCode: code, message: err.message }, "GraphQL error");
            }
          }
        },
      };
    },
  };

  // Schema shared by the authenticated ("/") and public ("/public") servers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolvers: IResolvers<any, Context>[] = [
    {
      Upload: GraphQLUpload,
    },
    AdminResolvers,
    ActivityResolvers,
    APIResolvers,
    CountersResolvers,
    DataResolvers,
    DateResolver,
    EntitiesResolvers,
    IdentifiersResolvers,
    ObjectResolver,
    ProjectsResolvers,
    SearchResolvers,
    TemplatesResolvers,
    UserResolvers,
    WorkspacesResolvers,
    {
      SearchResult: {
        __resolveType(result: { _id: string }) {
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
  ];

  // Setup the GraphQL server
  const httpServer = http.createServer(app);
  const server = new ApolloServer<Context>({
    typeDefs: typedefs,
    resolvers,
    introspection: process.env.NODE_ENV !== "production",
    csrfPrevention: true,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer }), loggingPlugin],
  });
  logger.info("Starting GraphQL server...");
  await server.start();
  logger.info("GraphQL server running!");

  // Root Query fields reachable on the public endpoint
  const PUBLIC_QUERY_FIELDS = [
    "workspace",
    "entity",
    "entities",
    "project",
    "projects",
    "projectEntities",
    "template",
    "templates",
    "templateUsage",
    "identifierFormats",
    "search",
    "downloadFile",
    "user",
  ];

  // Subset of "User" fields safe to expose unauthenticated (excludes api_keys, token, email, role, etc.)
  const PUBLIC_USER_FIELDS = ["_id", "name", "firstName", "lastName", "image", "account_orcid", "__typename"];

  // Rejects mutations and any root selection outside PUBLIC_QUERY_FIELDS (including fragments)
  const publicAccessPlugin: ApolloServerPlugin<Context> = {
    async requestDidStart() {
      return {
        async didResolveOperation({ operation }) {
          if (!operation) return;

          // Only "query" operations are permitted (read-only)
          if (operation.operation !== "query") {
            throw new GraphQLError("This operation is not available", {
              extensions: { code: "FORBIDDEN" },
            });
          }

          // Limit the subset of "query"-able fields
          for (const selection of operation.selectionSet.selections) {
            if (selection.kind !== "Field" || !_.includes(PUBLIC_QUERY_FIELDS, selection.name.value)) {
              throw new GraphQLError("This field is not available", {
                extensions: { code: "FORBIDDEN" },
              });
            }

            // Restrict "user" sub-selections to a safe subset to avoid leaking credentials/PII
            if (selection.name.value === "user" && selection.selectionSet) {
              for (const userSelection of selection.selectionSet.selections) {
                if (userSelection.kind !== "Field" || !_.includes(PUBLIC_USER_FIELDS, userSelection.name.value)) {
                  throw new GraphQLError("This field is not available", {
                    extensions: { code: "FORBIDDEN" },
                  });
                }
              }
            }
          }
        },
      };
    },
  };

  // Unauthenticated GraphQL server, restricted to PUBLIC_QUERY_FIELDS via publicAccessPlugin
  const publicServer = new ApolloServer<Context>({
    typeDefs: typedefs,
    resolvers,
    introspection: process.env.NODE_ENV !== "production",
    csrfPrevention: true,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer }), publicAccessPlugin],
  });
  logger.info("Starting public GraphQL server...");
  await publicServer.start();
  logger.info("Public GraphQL server running!");

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

  // Unauthenticated public Workspace endpoint, bypasses checkSession
  app.use(
    "/public/:workspace",
    cors<cors.CorsRequest>({
      origin: origins,
      credentials: true,
    }),
    express.json(),
    expressMiddleware(publicServer, {
      context: async ({ req }): Promise<Context> => ({
        user: "",
        workspace: req.params.workspace || "",
        userRole: "user",
      }),
    }),
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
      context: async ({ req, res }): Promise<Context> => {
        // Use the verified better-auth session (already resolved in checkSession)
        // rather than trusting the client-sent user header
        return {
          user: res.locals.session?.user?.id || "",
          workspace: (req.headers.workspace as string) || "",
          userRole: ((res.locals.session?.user as Record<string, unknown>)?.role as string) || "user",
        };
      },
    }),
    helmet(),
  );

  // Start the server
  logger.info("Starting Express server...");
  httpServer.listen({ port: port });
  logger.info(`Express server running at: http://127.0.0.1:${port}/`);
};

start();
