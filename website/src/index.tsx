// React imports
import React from "react";
import { createRoot } from "react-dom/client";

// Utility imports
import _ from "lodash";

// Application
import App from "./App";

// Render the application
const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<App />);
