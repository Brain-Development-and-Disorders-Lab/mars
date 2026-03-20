// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      // Directories
      "dist/",
      "node_modules/",
      // Files
      "eslint.config.mjs",
      "gulpfile.js",
      "jest.config.js",
      "webpack.*.js",
      "*.d.ts",
      "yarn.lock",
    ],
  },
);
