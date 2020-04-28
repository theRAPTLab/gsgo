/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  FullScreen - full-height view that must be root component of View
  View       - vertical-growable area inside a FullScreen view
  Row        - vertical row that can contain Cell
  RowFixed   - fixed-height row with default minHeight
  Cell       - horizontal-growable area inside of Row
  CellFixed  - fixed-width cell with default minWidth
  MD         - ReactMarkdown component with some additional styling

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import clsx from 'clsx';
// material ui
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
// utility components
import { MD } from '../components/ReactMarkdown';

/// SHARED CUSTOM STYLES //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// create useStyles() hook with theme object included
/// the useStyles() hook also can receive a parameter for further customization
const useStyles = makeStyles(theme => ({
  urscreen: theme.urScreenPage,
  urscrollable: theme.urScrollableScreenPage,
  urview: theme.urScreenView,
  fixedHeight: {
    minHeight: '100px'
  },
  flexRow: {
    display: 'flex',
    flexFlow: 'row nowrap',
    flexGrow: 1
  },
  fixedWidth: {
    width: '100'
  },
  flexWidth: {
    flexGrow: 1
  },
  inset: { padding: `${theme.spacing(1)}px`, overflow: 'auto' }
}));

/// UR LAYOUT COMPONENTS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Full screen Page Layout
 *  This is the outmost required wrapper on a page
 *  to enable full-screen stretching layout.
 *
 */
function URView(props) {
  const classes = useStyles();
  const { children, scrollable, className, ...other } = props;
  let viewClass = scrollable ? classes.urscrollable : classes.urscreen;
  // if you need read-only theme parameters directly in the component
  return (
    <Box className={clsx(viewClass, className)} {...other}>
      {children}
    </Box>
  );
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** View element for Page
 *  Use this when you want to have elements under the page nav
 *  stretch to fill available vertical space
 */
function View(props) {
  const classes = useStyles();
  const { children, className, ...other } = props;
  return (
    <Box className={clsx(classes.urview, className)} {...other}>
      {children}
    </Box>
  );
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** TextView element for Page
 *  Similar to View but accepts only a text as children to be processed
 *  through React Markdown
 */
function TextView(props) {
  const classes = useStyles();
  const { children } = props;
  return (
    <View className={classes.inset}>
      <Row>
        <Cell>
          <MD>{children}</MD>
        </Cell>
      </Row>
    </View>
  );
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Row, fixed-height
 *  you may override minHeight, height
 */
function RowFixed(props) {
  const classes = useStyles();
  const { children, className, ...other } = props;
  // if you need read-only theme parameters directly in the component
  return (
    <Box className={clsx(classes.fixedHeight, className)} {...other}>
      {children}
    </Box>
  );
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Row, flexible height
 *  you may override flexGrow, flexShrink, flexBasis
 */
function Row(props) {
  const classes = useStyles();
  const { children, className, ...other } = props;
  return (
    <Box className={clsx(classes.flexRow, className)} {...other}>
      {children}
    </Box>
  );
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Cell, fixed-width
 *  you may override flexGrow, flexShrink, alignSelf
 */
function CellFixed(props) {
  const classes = useStyles();
  const { children, className, ...other } = props;
  return (
    <Box className={clsx(classes.fixedWidth, className)} {...other}>
      {children}
    </Box>
  );
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** flex-width cell
 *  can override flexGrow, flexShrink, flexBasis
 */
function Cell(props) {
  const classes = useStyles();
  const { children, className, ...other } = props;
  return (
    <Box className={clsx(classes.flexWidth, className)} {...other}>
      {children}
    </Box>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { URView, View, Row, RowFixed, Cell, CellFixed, Box, MD, TextView };
