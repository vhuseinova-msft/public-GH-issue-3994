const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const StatoscopeWebpackPlugin = require("@statoscope/webpack-plugin").default;
const TerserPlugin = require("terser-webpack-plugin");
const path = require("path");

module.exports = {
  stats: "verbose",
  entry: "./src/index.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node-modules/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loader: "file-loader",
        options: {
          name: "/public/icons/[name].[ext]",
        },
      },
    ],
  },
  // devtool: "inline-source-map",
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },
  mode: "production",
  // can be uncommented if you want to see bundle size only
  // plugins: [new BundleAnalyzerPlugin()],
  plugins: [new StatoscopeWebpackPlugin()],
  optimization: {
    usedExports: true,
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
};
