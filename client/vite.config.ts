import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    outDir: "dist",
  },
  server: {
    host: "127.0.0.1",
    port: 8080,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./test/setup.ts",
  },
});
