/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Tracker - Main Application View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';

import UR from '@gemstep/ursys/client';

import RUNTIME from '../modules/sim/runtime';
import Renderer from '../modules/tests/test-renderer';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TrackerJSX');

/// STYLES ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const useStyles = theme => ({
  root: {
    display: 'grid',
    width: '100vw',
    height: '100vh',
    gridTemplateColumns: 'repeat(12,1fr)',
    gridTemplateRows: '50px 1fr 100px',
    gridGap: theme.spacing(1)
  },
  cell: {
    padding: '5px'
  }
});

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class Tracker extends React.Component {
  // constructor
  constructor(props) {
    super(props);
    console.log('constructed Tracker');
  }

  componentDidMount() {
    console.log('componentDidMount Tracker');
    const renderRoot = document.getElementById('root-renderer');
    /* test code */
    // Sim.LoadSimulation();
    // Sim.StartSimulation();
    /* end test code */
    Renderer.Init(renderRoot);
    Renderer.HookResize(renderRoot);
    Renderer.Draw();
  }

  componentWillUnmount() {
    console.log('componentWillUnmount Tracker');
  }

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <div
          style={{
            gridColumnEnd: 'span 12',
            backgroundColor: 'lightcyan'
          }}
        >
          <Typography>RESIZEABLE PIXIJS SHELL</Typography>
        </div>
        <div
          className={classes.cell}
          style={{ gridColumnEnd: 'span 2', backgroundColor: 'lavender' }}
        >
          left
        </div>
        <div
          id="root-renderer"
          style={{
            gridColumnEnd: 'span 8',
            position: 'relative',
            width: '100%',
            height: '100%'
          }}
        >
          mid
        </div>
        <div
          className={classes.cell}
          style={{ gridColumnEnd: 'span 2', backgroundColor: 'lavender' }}
        >
          right
        </div>
        <div
          className={classes.cell}
          style={{ gridColumnEnd: 'span 12', backgroundColor: 'thistle' }}
        >
          footer
        </div>
      </div>
    );
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// requirement for URSYS MODULES and COMPONENTS
Tracker.MOD_ID = __dirname;

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStyles)(Tracker);
