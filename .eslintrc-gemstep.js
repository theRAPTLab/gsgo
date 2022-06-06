/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ESLINT CONFIGURATION for URSYS/STEPSYS with VISUAL STUDIO CODE
  These are the specific overrides we use. It's imported in our
  .eslintrc.js file

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const URSYS_STYLE = {
  /* ursys style overrides */
  'spaced-comment': 'off',
  'camelcase': 'off',
  'comma-dangle': ['error', 'never'],
  'no-underscore-dangle': 'off',
  'lines-between-class-members': 'off',
  'no-bitwise': 'off',
  '@typescript-eslint/camelcase': 'off',
  '@typescript-eslint/no-use-before-define': 1,
  '@typescript-eslint/no-unused-vars': 'off',
  '@typescript-eslint/quotes': 'warn',
  '@typescript-eslint/naming-convention': 'off',
  '@typescript-eslint/lines-between-class-members': 'off',
  '@typescript-eslint/quotes': 'off',
  'import/prefer-default-export': 'off',
  '@typescript-eslint/naming-convention': 'off',
  'object-shorthand': 'off'
};
/* allow classroom debugging by researchers */
const CLASSROOM = {
  'no-console': 'off',
  'no-debugger': 'warn',
  'no-alert': 'warn',
  'no-restricted-syntax': 'off'
};
/* turn off typescript recommendations */
const YUCK_TS = {
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

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  ...URSYS_STYLE,
  ...CLASSROOM,
  ...YUCK_TS,
  ...YUCK_MUI,
  ...YUCK_PRETTIER,
  ...FORCE_OPTIONS
};
