const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common");
const webpack = require("webpack"); // Import webpack

module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    static: [path.join(__dirname, "dist"), path.join(__dirname, "img")],
    hot: true,
    historyApiFallback: true,
  },
  plugins: [
    // Add this plugin configuration
    // new webpack.DefinePlugin({
    //   'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    // }),
  ],
});
