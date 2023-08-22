// .env configuration
import "dotenv/config";

// Libraries
import express from "express";
import cors from "cors";
import consola from "consola";

const fileUpload = require("express-fileupload");

// Get the connection functions
import { connectPrimary, connectSystem } from "./database/connection";

// Routes
import ActivityRoute from "./routes/Activity";
import EntitiesRoute from "./routes/Entities";
import ProjectsRoute from "./routes/Projects";
import AttributesRoute from "./routes/Attributes";
import SearchRoute from "./routes/Search";
import SystemRoute from "./routes/System";
import AuthenticationRoute from "./routes/Authentication";

const app = express();
const port = process.env.PORT || 8000;

// Configure Express, enable CORS middleware and routes
app.use(cors({ credentials: true, origin: true }));
app.use(express.json({ limit: "50mb" }));
app.use(fileUpload());
app.use(
  ActivityRoute,
  AttributesRoute,
  AuthenticationRoute,
  EntitiesRoute,
  ProjectsRoute,
  SearchRoute,
  SystemRoute
);

// Start the Express server
app.listen(port, () => {
  // Connect to the primary database when the server starts
  connectPrimary().then(() => {
    // Connect to the system database
    connectSystem().then(() => {
      consola.info(`Server is running on port: ${port}`);
    });
  });
});
