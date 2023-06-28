// React imports
import React from "react";
import { createRoot } from "react-dom/client";

// Logging
import { consola } from "consola";
consola.wrapConsole();

// Application
import App from "./App";

// Render the application
const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<App />);
