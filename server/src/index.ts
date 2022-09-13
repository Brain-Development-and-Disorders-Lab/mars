// .env configuration
import "dotenv/config";

// Libraries
import express from "express";
import cors from "cors";
import consola from "consola";

// Get the connection functions
import { connect } from "./database/connection";

// Routes
import samplesRoute from "./routes/samples";
import collectionsRoute from "./routes/collections";
import attributesRoute from "./routes/attributes";
import searchRoute from "./routes/search";

// File watching
const PATH = "/Volumes/linda.richards/Active/CCD\ Neurocognitive\ Task\ Data";
import { watchFiles } from "./lib/watcher";

const app = express();
const port = process.env.PORT || 8000;

// Configure Express, enable CORS middleware and routes
app.use(cors());
app.use(express.json());
app.use(
  samplesRoute,
  collectionsRoute,
  attributesRoute,
  searchRoute
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
