import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build, defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";

const SSR_OUT_DIR = "dist-ssr";
const PRERENDER_PLACEHOLDER = "<!--app-html-->";

// Builds the App for Node after the client build and injects its HTML into dist/index.html
const prerender = (): Plugin => ({
  name: "metadatify-prerender",
  apply: "build",
  async closeBundle() {
    await build({ build: { ssr: "src/index.tsx", outDir: SSR_OUT_DIR }, logLevel: "warn" });

    const ssrDir = path.resolve(__dirname, SSR_OUT_DIR);
    const indexPath = path.resolve(__dirname, "dist", "index.html");
    const { render } = await import(pathToFileURL(path.join(ssrDir, "index.mjs")).href);

    const template = fs.readFileSync(indexPath, "utf-8");
    if (!template.includes(PRERENDER_PLACEHOLDER)) {
      throw new Error(`Prerender placeholder ${PRERENDER_PLACEHOLDER} not found in ${indexPath}`);
    }
    fs.writeFileSync(indexPath, template.replace(PRERENDER_PLACEHOLDER, await render()));
    fs.rmSync(ssrDir, { recursive: true, force: true });
  },
});

export default defineConfig(({ isSsrBuild }) => ({
  base: "./",
  plugins: isSsrBuild ? [react()] : [react(), prerender()],
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
}));
