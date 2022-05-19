// .env configuration
import "dotenv/config";

import express from "express";
import cors from "cors";

// Get the connection functions
import { run } from "./lib/connection";

// Routes
import samplesRoute from "./routes/samples";
import groupsRoute from "./routes/groups";
import attributesRoute from "./routes/attributes";
import searchRoute from "./routes/search";

const app = express();
const port = process.env.PORT || 8000;

// Configure middleware
app.use(cors());
app.use(express.json());
app.use(samplesRoute, groupsRoute, attributesRoute, searchRoute);

// Start the server
app.listen(port, () => {
  // Connect to the database when the server starts
  run(function (err: any) {
    if (err) console.error(err);
  });
  console.log(`Server is running on port: ${port}`);
});
