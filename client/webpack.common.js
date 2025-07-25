const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

// Environment variables
require("dotenv").config({ path: "./.env" });

module.exports = {
  entry: "./src/index.tsx",
  plugins: [
    new HtmlWebpackPlugin({
      title: "Metadatify",
      template: "src/index.html",
      favicon: "src/img/Favicon.png",
    }),
    new webpack.DefinePlugin({
      "process.env": JSON.stringify(process.env),
      "process.env.VERSION": JSON.stringify(process.env.npm_package_version),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.s[ac]ss$/i,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
    ],
  },
  resolve: {
    modules: [
      path.resolve(__dirname, "./"),
      path.resolve(__dirname, "node_modules"),
    ],
    alias: {
      "@components": path.resolve(__dirname, "./src/components/"),
      "@database": path.resolve(__dirname, "./src/database/"),
      "@hooks": path.resolve(__dirname, "./src/hooks/"),
      "@pages": path.resolve(__dirname, "./src/pages/"),
      "@types": path.resolve(__dirname, "../types"),
      "entities/decode": path.resolve(
        __dirname,
        "./node_modules/parse5/node_modules/entities/dist/commonjs/decode.js",
      ),
      "entities/escape": path.resolve(
        __dirname,
        "./node_modules/parse5/node_modules/entities/dist/commonjs/escape.js",
      ),
    },
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "client.bundle.js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
  },
};
