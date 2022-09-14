// .env configuration
import "dotenv/config";

// Libraries
import express from "express";
import cors from "cors";
import consola, { LogLevel } from "consola";

// Get the connection functions
import { connect } from "./database/connection";

// Routes
import EntitiesRoute from "./routes/Entities";
import CollectionsRoute from "./routes/Collections";
import AttributesRoute from "./routes/Attributes";
import SearchRoute from "./routes/Search";

// File watching
const PATH = "/Volumes/linda.richards/Active/CCD\ Neurocognitive\ Task\ Data";
import { watchFiles } from "./lib/watcher";

// Console logging configuration
consola.level = LogLevel.Debug;

const app = express();
const port = process.env.PORT || 8000;

// Configure Express, enable CORS middleware and routes
app.use(cors());
app.use(express.json());
app.use(
  EntitiesRoute,
  CollectionsRoute,
  AttributesRoute,
  SearchRoute
);

// Start the Express server
app.listen(port, () => {
  // Connect to the database when the server starts
  connect((error: any) => {
    if (error) consola.error(error);
  });

  consola.info(`Server is running on port: ${port}`);
});

// Start file watcher
watchFiles(PATH);
