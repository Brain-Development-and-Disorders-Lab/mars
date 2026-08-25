// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    ignores: [
      // Directories
      "dist/",
      "node_modules/",
      "playwright-report/",
      "test-results/",
      "storybook-static/",
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
  {
    files: ["test/integration/**"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  },
  eslintConfigPrettier,
);
