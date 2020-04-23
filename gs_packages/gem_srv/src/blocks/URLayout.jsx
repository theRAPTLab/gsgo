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
  pagemode: theme.urFullScreenApp,
  viewmode: theme.urFullScreenView,
  scrollmode: theme.urScrollablePageView,
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
  }
}));

/// UR LAYOUT COMPONENTS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Full screen Page Layout
 *  This is the outmost required wrapper on a page
 *  to enable full-screen stretching layout.
 *
 */
function FullScreen(props) {
  const classes = useStyles();
  const { children, className, ...other } = props;
  // if you need read-only theme parameters directly in the component
  return (
    <Box className={clsx(classes.pagemode, className)} {...other}>
      {children}
    </Box>
  );
}

/** Scrollable Page
 */
function ScrollPage(props) {
  const classes = useStyles();
  const { children, className, ...other } = props;
  // if you need read-only theme parameters directly in the component
  return (
    <Box className={clsx(classes.scrollmode, className)} {...other}>
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
    <Box className={clsx(classes.viewmode, className)} {...other}>
      {children}
    </Box>
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
export { FullScreen, ScrollPage, View, Row, RowFixed, Cell, CellFixed, Box, MD };
