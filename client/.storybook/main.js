const path = require("path");

/** @type { import('@storybook/react-webpack5').StorybookConfig } */
const config = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-webpack5-compiler-swc"],
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  webpackFinal: async (config) => {
    // Add SCSS support
    config.module.rules.push({
      test: /\.s[ac]ss$/i,
      use: ["style-loader", "css-loader", "sass-loader"],
    });

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
module.exports = config;
