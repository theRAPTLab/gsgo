/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ESLINT CONFIGURATION for URSYS/STEPSYS with VISUAL STUDIO CODE
  These are the specific overrides we use. It's imported in our
  .eslintrc.js file

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const LINT_LEVEL = process.env.GS_LINT_LEVEL || 1;

/// EXTENSIONS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const EXTENDS = [
  'plugin:react/recommended', // handle jsx syntax
  'plugin:@typescript-eslint/eslint-recommended' // basic typescript rules
];
if (LINT_LEVEL > 0) {
  EXTENDS.push('plugin:@typescript-eslint/recommended-requiring-type-checking'); // extra type checking
}
EXTENDS.push(
  'airbnb-typescript', // add airbnb typescript rules
  'prettier' // version 8.0.0 2021-02-21 change
);

/// RULE OVERRIDES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const URSYS_STYLE = {
  /* ursys style overrides */
  'spaced-comment': 'off',
  'camelcase': 'off',
  'comma-dangle': ['error', 'never'],
  'no-underscore-dangle': 'off',
  'lines-between-class-members': 'off',
  'no-bitwise': 'off',
  'import/prefer-default-export': 'off',
  'object-shorthand': 'off',
  '@typescript-eslint/camelcase': 'off',
  '@typescript-eslint/no-use-before-define': 1,
  '@typescript-eslint/no-unused-vars': 'off',
  '@typescript-eslint/quotes': 'warn',
  '@typescript-eslint/naming-convention': 'off',
  '@typescript-eslint/lines-between-class-members': 'off',
  '@typescript-eslint/quotes': 'off',
  '@typescript-eslint/naming-convention': 'off'
};
/* allow classroom debugging by researchers */
const CLASSROOM = {
  'no-console': 'off',
  'no-debugger': 'warn',
  'no-alert': 'warn',
  'no-restricted-syntax': 'off'
};
/* turn off typescript recommendations */
const HELP_TSJS = {
  'no-undef': 'off', // TS handles this better; works with global types
  'no-unused-vars': 'off',
  'no-shadow': 'off',
  'no-param-reassign': 'off',
  'object-curly-newline': 'off',
  'react/jsx-props-no-spreading': 'off',
  'arrow-body-style': 'off',
  'no-plusplus': 'off',
  'prefer-const': 'off',
  'prefer-destructuring': 'off',
  'class-methods-use-this': 'off',
  'jsx-a11y/label-has-associated-control': 'off'
};
/* turn off typescript unsafe checks (mixed code) */
const MIXED_TSJS =
  LINT_LEVEL < 2
    ? {
        // for linting with type checking on
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/restrict-plus-operands': 'off',
        '@typescript-eslint/unbound-method': 'off'
      }
    : {};
/* disable rules for material-ui sanity */
const YUCK_MUI = {
  'react/forbid-prop-types': 'off',
  'react/prop-types': 'off'
};
/* disable prettier conflicts manually */
const YUCK_PRETTIER = {
  'arrow-parens': 'off'
};
/* check for missing dev dependencies as well */
const FORCE_OPTIONS = {
  'import/no-extraneous-dependencies': [
    'error',
    {
      'devDependencies': true
    }
  ]
};
const RULES = {
  ...URSYS_STYLE,
  ...CLASSROOM,
  ...HELP_TSJS,
  ...MIXED_TSJS,
  ...YUCK_MUI,
  ...YUCK_PRETTIER,
  ...FORCE_OPTIONS
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  EXTENDS,
  RULES
};
