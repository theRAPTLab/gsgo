/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Root View of GEMSTEP Wireframe

  NOTE: this page runs from the server side, so we can't access objects like
  window or document, or manipulate the DOM. To debug, use the node debugger
  through VSCode.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import Head from 'next/head';
import { Box, Grid, Typography, Paper } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import GSAppBar from '../src/components/GSAppBar';
import GSLoginBar from '../src/components/GSLoginBar';

/// CUSTOM STYLES FOR THIS COMPONENT //////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// create useStyles() hook with theme object included
/// the useStyles() hook also can receive a parameter for further customization
const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1
  },
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gridGap: theme.spacing(3)
  },
  paper: {
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    whiteSpace: 'nowrap',
    marginBottom: theme.spacing(1)
  }
}));

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: global theme properties are passed in _app.js by <ThemeProvider>
/// See theme.js and theme-derived.js to customize theme properties
function Main() {
  // you may have some state to calculate based on useEffect, etc
  const computedState = { show: true };

  // calculate dynamic rules by passing state
  const classes = useStyles(computedState); // dictionary of { rule : jss classname }

  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <>
      <GSLoginBar />
      <GSAppBar />
      <Box className={classes.root}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Paper className={classes.paper}>xs=12</Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper className={classes.paper}>xs=3</Paper>
          </Grid>
          <Grid item xs={8}>
            <Paper className={classes.paper}>xs=8</Paper>
          </Grid>
          <Grid item xs={1}>
            <Paper className={classes.paper}>xs=1</Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper className={classes.paper}>xs=12</Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper className={classes.paper}>xs=12</Paper>
          </Grid>
        </Grid>
      </Box>
    </>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Main; // functional component
