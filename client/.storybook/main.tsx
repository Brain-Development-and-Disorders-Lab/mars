import path, { dirname } from "path";
import { fileURLToPath } from "url";

// Setup filenames and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type { import('@storybook/react-webpack5').StorybookConfig } */
const config = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-webpack5-compiler-swc",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
    "storybook-addon-apollo-client",
  ],
  framework: "@storybook/react-webpack5",
  webpackFinal: async (config) => {
    // Match path aliases from webpack.common.js
    config.resolve.alias = {
      ...config.resolve.alias,
      "@components": path.resolve(__dirname, "../src/components/"),
      "@database": path.resolve(__dirname, "../src/database/"),
      "@hooks": path.resolve(__dirname, "../src/hooks/"),
      "@lib": path.resolve(__dirname, "../src/lib/"),
      "@pages": path.resolve(__dirname, "../src/pages/"),
      "@types": path.resolve(__dirname, "../../types"),
      "@variables": path.resolve(__dirname, "../src/variables"),
    };

    return config;
  },
};
export default config;
