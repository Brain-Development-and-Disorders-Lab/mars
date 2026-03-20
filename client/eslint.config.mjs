// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

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
  storybook.configs["flat/recommended"],
);
