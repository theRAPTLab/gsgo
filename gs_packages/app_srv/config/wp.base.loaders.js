/* eslint-disable @typescript-eslint/quotes */
/*/////////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  This configuration defines the webpack rules for processing different file
  types in our modular javascript code. It is a base configuration that is
  shared with the packaging and distribution configurations.

  Specifically, it allows us to import/require different kinds of files in our
  source code. Webpack uses these rules to transform the code on-the-fly.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * ///////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
const Path = require('path');

/// LOAD LOCAL MODULES ////////////////////////////////////////////////////////
const URSERV = require('@gemstep/ursys/server');

/// DEBUG INFO ////////////////////////////////////////////////////////////////
const PR = URSERV.Prompt('PACK');

/// CONSTANTS INFO ////////////////////////////////////////////////////////////
const DIR_ROOT = Path.resolve(__dirname, '../');
// Any directories you will be adding code/files into
// For an Electron-binary debug server using webpack middleware, you may need
// to add the additional paths where the built files are located
const DIR_INCLUDES = [Path.join(DIR_ROOT, 'src')];

/// MODULE EXPORT /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const WebpackLoaders = () => {
  console.log(...PR('... setting common webpack loader rules'));
  return {
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          loader: 'babel-loader',
          include: DIR_INCLUDES,
          // don't process js/jsx in node_modules
          exclude: /node_modules/
        },
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          // don't process ts/tsx in node_modules
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: [{ loader: 'style-loader' }, { loader: 'css-loader' }]
          // some static css is in node_modules, so don't exclude it
        },
        {
          // allegedly create unified source maps from output .js files from everyone
          // including libraries with their own source maps (?)
          // this loader runs after all js files are produced (?)
          enforce: 'pre', // webpack.js.org/configuration/module/#ruleenforce
          test: /\.js$/,
          loader: 'source-map-loader'
        },
        {
          test: /\.(jpe?g|png|gif)$/,
          use: [{ loader: 'file-loader?name=img/[name]__[hash:base64:5].[ext]' }],
          // note: applies only to "imported" images in source code. Doesn't affect
          // static assets copied as-is (see wp.pack.* configs)
          include: DIR_INCLUDES
        },
        {
          test: /\.(eot|svg|ttf|woff|woff2)$/,
          use: [
            { loader: 'file-loader?name=font/[name]__[hash:base64:5].[ext]' }
          ],
          // note: applies only to "imported" images in source code. Doesn't affect
          // static assets copied as-is (see wp.pack.* configs)
          include: DIR_INCLUDES
        }
      ]
    },
    resolve: {
      // make require() handle both .js and .jsx files (default only .js)
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      // create chrome webapp path aliases (webapps only)
      alias: {
        config: Path.resolve(__dirname, '../config'),
        // ursys: Path.resolve(__dirname, '../ursys'),
        // util: Path.resolve(__dirname, '../src/util'),
        // step: Path.resolve(__dirname, '../src/step/'),
        app: Path.resolve(__dirname, '../src/app')
      }
    }
  };
};

/// EXPORT CONFIGURATION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// merges the base loaders with additional webapp-specific config parameters
module.exports = WebpackLoaders;
