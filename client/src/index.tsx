// React imports
import React from "react";
import { createRoot } from "react-dom/client";

// Utility imports
import _ from "lodash";
import { LogLevels, consola } from "consola";

// Application
import App from "./App";

// Configure logging
consola.wrapConsole();
if (_.isEqual(process.env.NODE_ENV, "development")) {
  // Display all logs in development mode
  consola.level = LogLevels.trace;
} else {
  consola.level = LogLevels.info;
}

// Render the application
const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<App />);
