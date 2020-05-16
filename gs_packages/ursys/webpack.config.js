const path = require('path');
const merge = require('webpack-merge');

// const URSYS = require('@gemscript/ursys/server')
const serverConfig = {
  entry: path.resolve(__dirname, 'src/index-server.js'),
  target: 'node', // sets node-specific webpack flags (web is default)
  output: {
    libraryTarget: 'commonjs',
    globalObject: 'this',
    path: path.resolve(__dirname, 'server'),
    filename: 'index.js'
  }
};

// import URSYS from '@gemscript/ursys/client'
const clientConfig = {
  entry: path.resolve(__dirname, 'src/index-client.js'),
  target: 'web', // sets browser-related webpack flags (web is default)
  output: {
    libraryTarget: 'umd', // universal module format
    globalObject: 'this',
    path: path.resolve(__dirname, 'client'),
    filename: 'index.js'
  }
};

// common configuration settings
const baseConfig = {
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: [
          path.resolve(__dirname, 'node_modules'), // ursys package
          path.resolve(__dirname, '../../node_modules') // lerna hoisted
        ],
        use: ['babel-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js'],
    modules: [
      path.resolve(__dirname, 'node_modules'), // ursys package modules
      path.resolve(__dirname, '../../node_modules'), // lerna hoisted modules
      path.resolve(__dirname, 'src')
    ]
  },
  mode: 'development',
  devtool: 'sourceMap',
  node: {
    // enable webpack's __filename and __dirname substitution in browsers
    // for use in URSYS lifecycle event filtering as set in SystemInit.jsx
    __filename: true,
    __dirname: true
  }
};

module.exports = [
  merge(baseConfig, clientConfig),
  merge(baseConfig, serverConfig)
];
