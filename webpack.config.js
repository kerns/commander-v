const path = require('path');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  mode: 'production', // Set mode to 'production' or 'development'
  entry: './extension.js',
  output: {
    filename: 'extension.bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  target: 'node',
  externals: [
    nodeExternals(),
    { vscode: 'commonjs vscode' },
  ],
  optimization: {
    minimize: true,
    minimizer: [new TerserWebpackPlugin()],
  },
  resolve: {
    extensions: ['.js'],
  },
};
