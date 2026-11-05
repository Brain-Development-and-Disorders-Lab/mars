// React imports
import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

// Utility imports
import _ from "lodash";

// Application
import App from "./App";

// Render the application
export const render = async (): Promise<string> => {
  if (!import.meta.env.SSR) return "";
  const { renderToString } = await import("react-dom/server");
  return renderToString(<App />);
};

// Render the application in the browser
// Hydrates the prerendered HTML in production builds, renders from scratch in development
if (typeof document !== "undefined") {
  const container = document.getElementById("root")!;
  if (container.firstElementChild) {
    hydrateRoot(container, <App />);
  } else {
    createRoot(container).render(<App />);
  }
}
