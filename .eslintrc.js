/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ESLINT CONFIGURATION for URSYS/STEPSYS with VISUAL STUDIO CODE

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const GS_RULES = require('./.eslintrc-gemstep');

module.exports = {
  env: {
    browser: true,
    es2020: true,
    node: true
  },
  /*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*:
    Plugins are packages that rules and sets of rules, but could also be
    something else (e.g. parser) that ESLINT can make use of.
    See: eslint.org/docs/user-guide/configuring#use-a-plugin

    When using Typescript, we have to modify the default behavior
    of ESLINT.
    See: github.com/typescript-eslint/typescript-eslint
  :*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*/
  plugins: ['react', '@typescript-eslint', 'import'],
  settings: {
    'import/resolver': {
      // This makes module resolution in VSCode work. Otherwise, it will flag
      // modules as undeclared because it can't find them. The import plugin
      // will read the tsconfig.json file to parse each file.
      // This also requires a .vscode/settings.json tweak:
      //   eslint.workingDirectories:[{mode:'auto'}]
      // See https://github.com/microsoft/vscode-eslint/issues/696 for hints
      // regarding relative directories, monorepos, and eslint 6 changes
      typescript: {
        directory: './tsconfig.json'
      }
    }
  },
  /*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*:
    Important: We use the official typescript-eslint/parser instead of the
    default espree parser. This supercedes TSLINT as of 2019, and is supported
    both by the Microsoft and ESLint teams.

    The typescript parser handles the typescript superset syntax and creates a
    compatible AST for ESLINT.
  :*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*/
  parser: '@typescript-eslint/parser',
  /*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*:
    We now configure what rules ESLINT will apply, in order of declaration.

    For more information using configuration, see:
    eslint.org/docs/user-guide/configuring#using-the-configuration-from-a-plugin
  :*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*/
  extends: [
    // OUR ESLINT STACK
    // Note: Ideally, we would construct our own set of rules by carefully
    // considering what's in each of these configurations, but this works
    'plugin:react/recommended', // handle jsx syntax
    'plugin:@typescript-eslint/eslint-recommended', // basic typescript rules
    // 'plugin:@typescript-eslint/recommended-requiring-type-checking', // extra type checking
    'airbnb-typescript', // add airbnb typescript rules
    'prettier' // version 8.0.0 2021-02-21 change
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  settings: {
    'react': {
      'version': 'detect'
    }
  },
  ignorePatterns: [
    '**/runtime',
    '**/built',
    '**/assets-src',
    '**/node_modules',
    '**/vendor/*.js'
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true // enable jsx parsing (plugin:react/recommended)
    },
    ecmaVersion: 2020, // parsing of modern javascript
    sourceType: 'module', // allows use of imports
    project: ['./tsconfig.json', './gs_packages/**/tsconfig.json'], // remember, we're using typescript-eslint/parser
    tsconfigRootDir: __dirname // hack: github.com/typescript-eslint/typescript-eslint/issues/251#issuecomment-567365174
  },
  /*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*:
    The "rules" field can override what was set in the "extends" field.
    I am turning off the rules that I find annoying or trigger false warnings
    in some code structures.
  :*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*/
  rules: GS_RULES
};
