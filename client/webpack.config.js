const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./src/index.tsx",
  mode: "development",
  plugins: [
    new HtmlWebpackPlugin({
      favicon: "img/Favicon.png",
      title: "Laboratory Data Management",
      template: "src/index.html",
    }),
  ],
  devServer: {
    static: [path.join(__dirname, "dist"), path.join(__dirname, "img")],
    hot: true,
    historyApiFallback: true,
  },
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
    alias: {
      "@components": path.resolve(__dirname, "./src/components/"),
      "@database": path.resolve(__dirname, "./src/database/"),
      "@pages": path.resolve(__dirname, "./src/pages/"),
      "@types": path.resolve(__dirname, "../types"),
    },
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "client.bundle.js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
  },
};
