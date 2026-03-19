const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common");

module.exports = merge(common, {
  mode: "development",
  devtool: "eval-source-map",
  devServer: {
    host: "127.0.0.1",
    port: "8080",
    static: [
      {
        directory: path.join(__dirname, "dist"),
      },
      {
        directory: path.join(__dirname, "img"),
      },
    ],
    hot: true,
    historyApiFallback: true,
  },
  plugins: [],
});
