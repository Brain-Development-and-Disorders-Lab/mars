// .env configuration
import "dotenv/config";

// Libraries
import _ from "lodash";
import express from "express";
import cors from "cors";
// @ts-ignore
import helmet from "helmet";
import consola, { LogLevels } from "consola";

import "source-map-support/register";

const fileUpload = require("express-fileupload");

// Get the connection functions
import { connectPrimary, connectSystem } from "./database/connection";

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

// Set logging level
consola.level =
  _.isEqual(process.env.NODE_ENV, "development") ||
  _.isEqual(process.env.NODE_ENV, "test")
    ? LogLevels.trace
    : LogLevels.info;

consola.info("Server mode:", process.env.NODE_ENV);

export const app = express();
const port = process.env.PORT || 8000;
const endpoint = "/mars";

// Configure Express, enable CORS middleware and routes
app.use(helmet());
app.use(cors({ credentials: true, origin: true }));
app.use(express.json({ limit: "50mb" }));
app.use(fileUpload());

// Use routes
app.use(ProjectsRoute); // ProjectsRoute now has authMiddleware applied to it
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

// Start the Express server
wrapper.listen(port, () => {
  // Connect to the primary database when the server starts
  connectPrimary().then(() => {
    // Connect to the system database
    connectSystem().then(() => {
      consola.success("Server port:", port);
      consola.success("Server endpoint:", endpoint);
    });
  });
});
