/* eslint-disable no-param-reassign */
/*/////////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  This configuration defines the webpack rules for creating the package for
  the web application. It imports the base.loaders config, then merges the
  input/output directory processing for source code starting at the designated
  entry points.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * ///////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
const Path = require('path');
const Webpack = require('webpack');
const WebpackMerge = require('webpack-merge');
const { PrefixUtil } = require('@gemstep/ursys/server');

/// LOAD WEBPACK PLUGINS //////////////////////////////////////////////////////
const CopyPlugin = require('copy-webpack-plugin');
const WriteFilesPlugin = require('write-file-webpack-plugin');
// const HtmlWebpackPlugin = require('html-webpack-plugin');

/// LOAD LOCAL MODULES ////////////////////////////////////////////////////////
const WebpackLoaders = require('./wp.base.loaders');

/// DEFINE CONSTANTS //////////////////////////////////////////////////////////
const PR = PrefixUtil(' PACK/BDL');
const DIR_ROOT = Path.resolve(__dirname, '..');
const DIR_OUT = Path.join(DIR_ROOT, 'built/web');
const DIR_SRC = Path.join(DIR_ROOT, 'src/app');
const FILE_BUNDLE = 'web-bundle.js';

/// MODE DEPENDENT ////////////////////////////////////////////////////////////
let ENTRY_FILES = ['./web-index.js'];
let MODE = 'development'; // optimization: webpack.js.org/configuration/mode/
let TARGET = 'web'; // platform: webpack.js.org/configuration/target/

/// DEFINE PACKAGING CONFIG ///////////////////////////////////////////////////
const WebpackPacker = env => {
  // adjust build parameters based on mode
  env = env || { DEVELOPMENT: 'default' };
  if (env && env.PRODUCTION) {
    console.log(...PR('... setting appsrv bundle rules (production)'));
    MODE = 'production';
  }
  if (env && env.DEVELOPMENT) {
    console.log(...PR('... setting appsrv bundle rules (dev)'));
    // add hot reload for development version
    ENTRY_FILES.push('webpack-hot-middleware/client?reload=true');
    MODE = 'development';
  }
  // files/folders to copy as-is via the copy plugin
  // github.com/webpack-contrib/copy-webpack-plugin
  const COPY_FILES = {
    patterns: [
      {
        from: 'web-index.html',
        to: `${DIR_OUT}/index.html`,
        toType: 'file'
      },
      {
        from: 'favicon.ico',
        to: `${DIR_OUT}/favicon.ico`,
        toType: 'file'
      },
      {
        from: 'static',
        to: `${DIR_OUT}/static`,
        toType: 'dir'
      }
    ]
  };

  // return package-related config parameters
  return {
    target: TARGET,
    mode: MODE,
    context: DIR_SRC, // base for all relative paths
    entry: ENTRY_FILES,
    output: {
      path: DIR_OUT,
      filename: FILE_BUNDLE,
      pathinfo: false // this speeds up compilation (https://webpack.js.org/guides/build-performance/#output-without-path-info)
      // publicPath: 'web',
    },
    node: {
      // enable webpack's __filename and __dirname substitution in browsers
      // for use in URSYS lifecycle event filtering as set in SystemInit.jsx
      __filename: true,
      __dirname: true
    },
    devtool: 'cheap-module-eval-source-map',
    // apply these additional plugins
    plugins: [
      new Webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('development'),
        COMPILED_BY: JSON.stringify(Path.basename(__filename))
      }),
      new WriteFilesPlugin({
        test: /^(.(?!.*\.hot-update.js$|.*\.hot-update.*))*$/ // don't write hot-updates at all, just bundles
      }),
      new CopyPlugin(COPY_FILES),
      new Webpack.HotModuleReplacementPlugin()
    ]
  };
}; // WebpackConfig()

/// EXPORT CONFIGURATION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// merges the base loaders with additional webapp-specific config parameters
module.exports = env => WebpackMerge(WebpackLoaders(env), WebpackPacker(env));
