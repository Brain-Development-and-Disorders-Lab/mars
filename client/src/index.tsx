// React imports
import React from "react";
import { createRoot } from "react-dom/client";

// Variables
import { DEBUG_LOGGING } from "./variables";

// Logging
import { LogLevels, consola } from "consola";
consola.wrapConsole();

if (DEBUG_LOGGING) {
  consola.level = LogLevels.verbose;
} else {
  consola.level = LogLevels.error;
}

// Application
import App from "./App";

// Render the application
const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<App />);
