/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ESLINT CONFIGURATION for URSYS/STEPSYS with VISUAL STUDIO CODE

  NOTE: ESLINT configuration is a bit convoluted because the format obfuscates
        the relations between plugins, rules, and configs and their roles.
        I've added links to relevant docs.

  NOTE: (Jan 2019) eslint doesn't understand javascript module format
        (e.g. export default). See docs.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

module.exports = {
  env: {
    browser: true,
    es6: true,
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
  plugins: ['react', '@typescript-eslint'],
  /*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*:
    Important: We use the official typescript-eslint/parser instead of the
    default espree parser. This supercedes TSLINT as of 2019, and is supported
    both by the Microsoft and ESLint teams.

    The typescript parser handles the typescript superset syntax and creates a
    compatible AST for ESLINT. Nifty!
  :*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*/
  parser: '@typescript-eslint/parser',
  /*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*:
    We now configure what rules ESLINT will apply, in order of declaration.

    For more information using configuration, see:
    eslint.org/docs/user-guide/configuring#using-the-configuration-from-a-plugin
  :*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*/
  extends: [
    // DEFAULT ESLINT RECOMMENDATION (no typescript, airbnb, or prettier)
    // 'eslint:recommended',
    // 'plugin:@typescript-eslint/eslint-recommended',
    // 'plugin:@typescript-eslint/recommended',
    // OUR ESLINT STACK
    'plugin:react/recommended', // handle jsx syntax
    'airbnb-typescript', // add airbnb typescript rules
    'prettier/@typescript-eslint' // disable formatting-related rules
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true // enable jsx parsing (plugin:react/recommended)
    },
    ecmaVersion: 2018, // parsing of modern javascript
    sourceType: 'module' // allows use of imports
  },
  /*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*:
    The "rules" field can override what was set in the "extends" field.
    I am turning off the rules that I find annoying or trigger false warnings
    in some code structures.
  :*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*/
  rules: {
    /* allow classroom debugging by researchers */
    'no-console': 'off',
    'no-debugger': 'warn',
    'no-alert': 'warn',
    /* ursys style overrides */
    'spaced-comment': 'off',
    camelcase: 'off',
    'comma-dangle': ['error', 'never'],
    'no-underscore-dangle': 'off',
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/no-use-before-define': 1,
    '@typescript-eslint/no-unused-vars': 'warn',
    /* allow for older syntax for clarity or style */
    'arrow-body-style': 'off',
    'no-plusplus': 'off',
    'prefer-const': 'off',
    'prefer-destructuring': 'off',
    'class-methods-use-this': 'off',
    /* additional prettier conflicts to disable */
    'arrow-parens': 'as-needed',
    /* relax some errors to warnings, or turn them off */
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: true
      }
    ],
    'no-unused-vars': 'warn',
    'no-param-reassign': 'warn'
  }
};
