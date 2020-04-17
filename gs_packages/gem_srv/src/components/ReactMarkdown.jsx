/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Render a Markdown block

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import MD from 'react-markdown';
///
import { makeStyles } from '@material-ui/core/styles';

/// LOCAL STYLES //////////////////////////////////////////////////////////////
/** NOTE:
 *  The & symbol means 'use the parent name'. In this style definition,
 *  it produces a class entry 'markdown' that will produce:
 *    .markdown { padding: 8px }
 *    .markdown > *:first-child { margin-top: 0 }
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const useStyles = makeStyles(theme => {
  return {
    markdown: {
      padding: `${theme.spacing(1)}px`,
      '& > *:first-child': { 'margin-top': 0 },
      '& > *:last-child': { 'margin-bottom': 0 }
    }
  };
});

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ReactMarkdown(props) {
  const classes = useStyles();
  const { children } = props;

  /// RENDER //////////////////////////////////////////////////////////////////
  return <MD className={classes.markdown}>{children}</MD>;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default ReactMarkdown; // functional component
