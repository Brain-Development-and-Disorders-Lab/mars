// .env configuration
import "dotenv/config";

import express from "express";
import cors from "cors";

// Get the connection functions
import connection from "./lib/connection";

// Routes
import samplesRoute from "./routes/samples";
import projectsRoute from "./routes/projects";
import parametersRoute from "./routes/parameters";

const app = express();
const port = process.env.PORT || 8000;

// Configure middleware
app.use(cors());
app.use(express.json());
app.use(samplesRoute, projectsRoute, parametersRoute);

// Start the server
app.listen(port, () => {
  // Connect to the database when the server starts
  connection.connectToServer(function (err: any) {
    if (err) console.error(err);
  });
  console.log(`Server is running on port: ${port}`);
});