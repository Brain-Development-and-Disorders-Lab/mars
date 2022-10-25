// React imports
import React from "react";
import { createRoot } from "react-dom/client";

// Application
import App from "./App";

const container = document.getElementById("root");

// Render the application
const root = createRoot(container!);
root.render(<App />);