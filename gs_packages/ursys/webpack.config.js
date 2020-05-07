const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'ur.js'),
  // see https://webpack.js.org/configuration/output/
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: 'UR',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js'],
    modules: [path.resolve(__dirname, 'src')]
  },
  mode: 'development',
  devtool: 'sourceMap'
};
