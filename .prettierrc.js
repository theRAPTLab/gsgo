/// PRETTIER //////////////////////////////////////////////////////////////////
/*/- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -\*\
    Handles formatting on save to enforce code style. Works in conjunction with
    ESLINT, which has to have its format-related rules disabled to not conflict
    with Prettier.

\*\- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - /*/

module.exports = {
  semi: true,
  singleQuote: true,
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  quoteProps: 'preserve',
  arrowParens: 'avoid'
};
