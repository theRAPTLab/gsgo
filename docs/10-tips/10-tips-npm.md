# Making a Package for npmjs

## Packages

A **package** is any folder described by a `package.json`, which can also be a zipped tarball or URL to the tarball, or is published to registry. It can also be a git url that when cloned results in a folder. 

Refer to a folder using the `file:` prefix. 

Packages can have **scopes** 

## Modules

A **module** is any file/directory in `node_modules` that can be loaded by the NodeJS `require()` function. At minimum, it has a `package.json` file must have at `main` field and an `index.js` file. 



## Client-side Javascript

Basic single-file module just wraps stuff in an intermediately-invoked function expression (IIFE) that can be loaded with a `<script src="mymodule.js"></script>` tag. The IIFE is used to scope functions inside within the browser's global scope.

```js
const MyModule = (function(){
  return {
    hello: function() { console.log('hello') }
  }
})();
```

## Server-side Javascript

node looks in 3 places for modules in `require('name')`

* built-in to Node (e.g. `fs`)
* in `node_modules`
* if name contains `./`, looks for a file

There is no global scope in Node, so modules use the `module.exports` convention instead. This is the **CommonJS** format (CJS)



## Approaches

The module formats are:

* CJS (Node)
* AMD (variant of CJS used only by RequireJS)
* UMD (a kluge of CJS and AMD to make them interoperable)
* ESM (the Javascript ES6 module format introduced in 2015)

ESM is the current hotness as of this writing. In 2020 NodeJS 14.x will provide *first class support* for ES6 modules.But for now we have to use **Bundlers** to convert CJS/whatever into something that can be imported by browser. 

* [webpack example](https://github.com/kalcifer/webpack-library-example) 
* [microbundle](https://github.com/developit/microbundle) for "small" libraries
* LokiJS source is written in pure Javascript with the UMD factory pattern. Building is done using uglifyjs.

### Approach 1: Use the UMD Factory Pattern

The pure js file has to be all-in-one like this. This would work for a simple module or a really big complicated one.

``` js
/** UMD Factory Pattern
 *  The first IIFE assigns the module to the appropriate
 *  export context, and is passed the value of 'this' as well as
 *  a factory function returning an IIFE wrapping the module functions.
 *  NOTE: You can't require/import anything in here. It has to be one file.
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    // AMD
    define([], factory);
  } else if (typeof exports === "object") {
    // CommonJS
    module.exports = factory();
  } else {
    // Browser globals
    root.loki = factory();
  }
})(this, function () {
  return (function () {
    /* define module stuff self-contained in here */
    return ModuleObject;
  })();
});
```

### Approach 2: Use Webpack

If you want to use `import` or `require` in UMD, then you need to use a bundler. Webpack is the one we're using here. We need to (1) add a `webpack.config.js` (2) modify `package.json` (3) use `npm run build` to transpile into the UMD module.

(1) In the [Webpack example](https://dev.to/_hridaysharma/setting-up-webpack-for-a-javascript-library-2h8m), the `webpack.config.js` has the important `globalObject`,  `library` and `libraryTarget` properties defined! The loadable module will be in `dist/index.js` after `npm run build` is executed.

```js
const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'ur.js'),  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: 'LIBNAME',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js'],
    modules: [path.resolve(__dirname, 'src')],
  },
  mode: 'development',
  devtool: 'sourceMap',
};
```

(2) In `package.json`,  here are the bare essentials to add:

```json
{
  "name": "@gemstep/ursys",
  "version": "0.0.1-alpha.4",
  "main": "dist/index.js",
  "scripts": {
    "build": "webpack"
  },
  "devDependencies": {
    "@babel/core": "^7.8.3",
    "@babel/preset-env": "^7.8.3",
    "babel-eslint": "^10.1.0",
    "babel-loader": "^8.0.6",
    "eslint": "^6.8.0",
    "webpack": "^4.41.5"
  }
}
```
In the actual source code in `index.js`, we can use ES6 module format and rely on webpack to transpile into the UMD format. We just export everything. However, this breaks if SOME code only works on node and SOME code only works in the browser. 

Enter Approach #3!

### Approach 3: Distinct Server and Client packages in the same npm package

In this version we create a **baseConfig**

``` js
const baseConfig = {
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
    modules: [
      path.resolve(__dirname, 'node_modules'),
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
```

We then merge the baseConfig with **clientConfig** and **serverConfig**, using slightly different **targets**. 

Here's **serverConfig** which sets `libraryTarget` to commonjs, with `target` environment node:

```js
// const URSYS = require('@gemscript/ursus/server')
const serverConfig = {
  entry: path.resolve(__dirname, 'src/export-server.js'),
  target: 'node', // sets node-specific webpack flags (web is default)
  output: {
    libraryTarget: 'commonjs',
    globalObject: 'this',
    path: path.resolve(__dirname, 'server'),
    filename: 'index.js'
  }
};
```

Here's **clientConfig** which uses the default target

```js
// import URSYS from '@gemscript/ursys/client'
const clientConfig = {
  entry: path.resolve(__dirname, 'src/export-client.js'),
  target: 'web', // sets browser-related webpack flags (web is default)
  output: {
    libraryTarget: 'umd', // universal module format
    globalObject: 'this',
    path: path.resolve(__dirname, 'client'),
    filename: 'index.js'
  }
};
```

The new `webpack.config.js` file uses `webpack-merge` to create two different output files in the root level of the package:

* `client/index.js`
* `server/index.js`

This is a bit unusual, but it allows us to import the library directly from npm, since `package.json` doesn't let you define multiple out files in `main`. You can specific