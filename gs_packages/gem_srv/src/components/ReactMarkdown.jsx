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
const useStyles = makeStyles(theme => {
  return {
    markdown: {
      '& > *:first-child': { 'margin-top': 0 },
      '& > *:last-child': { 'margin-bottom': 0 },
      '& ul, & ol': { 'padding-inline-start': '1em' }
    }
  };
});

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default MD; // functional component
