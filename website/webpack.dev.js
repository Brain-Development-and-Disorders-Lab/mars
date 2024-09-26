const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common");

module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    static: [path.join(__dirname, "dist"), path.join(__dirname, "src", "img")],
    hot: true,
    historyApiFallback: true,
  },
  plugins: [],
});
