## Speeding-up Compile

I suspected that the build system for GEM_SRV was double-compiling. When I looked at `wp.base.loaders.js` (our webpack configuration base) I saw both `babel-loader` and `ts-loader` compiling files one-after-the other. First Babel handles all the JS, then Typescript handles all the TSX. However...this takes about 26-29 seconds. 

Long story short, by having `babel-loader` handle **both** js and typescript, the compilation drops down to about 6 seconds. 

Changes made:

* in `wp.base.loaders`, changed the test for `babel-loader` to `/\.(jsx?|tsx?)$/` from just `jsx?`
* also comment-out the `ts-loader` test, since babel will be handling it all now
* in `.babelrc`, add  ` "@babel/preset-typescript"` to end of presets. 

---

## GEM-SRV webpack config

### .babelrc

```
{
  "presets": [
    "@babel/preset-env",
    "@babel/preset-react",
    "@babel/preset-typescript"
  ],
  "plugins": [
    "@babel/plugin-syntax-dynamic-import",
    "@babel/plugin-transform-runtime",
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-proposal-export-namespace-from",
    "@babel/plugin-proposal-throw-expressions"
  ]
}
```

### wp.base.loaders.js

```
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
const PR = URSERV.PrefixUtil(' PACK/RSV');

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
        // OPTION 1: use Babel to handle JS and TS
        // .babelrc adds @babel/preset-typescript to make possible
        {
          test: /\.(jsx?|tsx?)$/,
          loader: 'babel-loader',
          include: DIR_INCLUDES,
          // don't process js/jsx in node_modules
          exclude: /node_modules/
        },
        // OPTION 2: use ts-loader to handle JS and TS
        // broken: compiles but bootstrap doesn't start the code
        // {
        //   test: /\.(tsx?|jsx?)$/,
        //   loader: 'ts-loader',
        //   include: DIR_INCLUDES,
        //   // don't process ts/tsx in node_modules
        //   exclude: /node_modules/
        // }

        {
          test: /\.css$/,
          include: DIR_INCLUDES,
          use: [{ loader: 'style-loader' }, { loader: 'css-loader' }]
          // some static css is in node_modules, so don't exclude it
        },
        {
          // allegedly create unified source maps from output .js files from everyone
          // including libraries with their own source maps (?)
          // this loader runs after all js files are produced (?)
          enforce: 'pre', // webpack.js.org/configuration/module/#ruleenforce
          test: /\.js$/,
          include: DIR_INCLUDES,
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
      // create webapp path aliases for module imports
      // for visual studio code live linting, update eslintrc
      alias: {
        config: Path.resolve(__dirname, '../config'),
        app: Path.resolve(__dirname, '../src/app'),
        lib: Path.resolve(__dirname, '../src/app/lib'),
        modules: Path.resolve(__dirname, '../src/app/modules'),
        static: Path.resolve(__dirname, '../src/app/static')
        // ursys: Path.resolve(__dirname, '../ursys'),
        // util: Path.resolve(__dirname, '../src/util'),
        // step: Path.resolve(__dirname, '../src/step/'),
      }
    }
  };
};

/// EXPORT CONFIGURATION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// merges the base loaders with additional webapp-specific config parameters
module.exports = WebpackLoaders;
```

### wp.pack.webpack.js

```
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
  const COPY_FILES = [
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
  ];

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

```

