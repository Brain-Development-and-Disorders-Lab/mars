// React imports
import React from "react";
import { createRoot } from "react-dom/client";

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
if (typeof document !== "undefined") {
  const container = document.getElementById("root");
  const root = createRoot(container!);
  root.render(<App />);
}
