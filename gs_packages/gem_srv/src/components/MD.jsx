/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Render a Markdown block
  accepts props for the ReactMarkdown component
  https://github.com/rexxars/react-markdown

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import ReactMarkdown from 'react-markdown';
///
import { makeStyles } from '@material-ui/core/styles';

/// LOCAL STYLES //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** The & symbol means 'use the parent name'. In this style definition,
 *  it produces a class entry 'markdown' that will produce:
 *    .markdown { padding: 8px }
 *    .markdown > *:first-child { margin-top: 0 }
 *    .markdown ul, .markdown ol { padding-inline-start: 1em }
 */
const useStyles = makeStyles({
  markdown: {
    '& > *:first-child': { marginTop: 0 },
    '& > *:last-child': { marginBottom: 0 },
    '& ul, & ol': { paddingInlineStart: '1rem' },
    '& h4, & h4 + p': { marginBottom: '-0.80rem' }
  }
});

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Use `MD` to convert Markdown to HTML
 */
function MD(props) {
  const classes = useStyles();
  const { children, ...other } = props;

  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <ReactMarkdown className={classes.markdown} {...other}>
      {children}
    </ReactMarkdown>
  );
}

/// HELPERS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MD.cq = string => {
  // eslint-disable-next-line prefer-template
  return '``' + string + '``';
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MD.cblock = string => {
  // eslint-disable-next-line prefer-template
  return '``````' + string + '``````';
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// eslint-disable-next-line import/prefer-default-export
export { MD }; // functional component
