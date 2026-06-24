import { defineConfig } from "vite";
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
    host: "localhost",
    port: 8080,
  },
});
