const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./src/index.tsx",
  plugins: [
    new HtmlWebpackPlugin({
      title: "Metadatify",
      template: "src/index.html",
      favicon: "src/img/Favicon.png",
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
    ],
  },
  resolve: {
    modules: [
      path.resolve(__dirname, "./"),
      path.resolve(__dirname, "node_modules"),
    ],
    alias: {},
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "client.bundle.js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
  },
};
