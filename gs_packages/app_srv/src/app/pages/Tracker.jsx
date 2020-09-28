/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Tracker - Main Application View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';

import UR from '@gemstep/ursys/client';
import SETTINGS from 'config/app.settings';
import { Init, HookResize } from '../modules/sim/display/renderer';
import '../modules/sim/runtime';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TRACKER', 'TagBlue');
const HCON = UR.HTMLConsoleUtil('console-left');
const BG_COLOR = '#F0F0F0';
const BG_TITLE = '#404040';
const { PROJECT_NAME } = SETTINGS;

/// STYLES ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const useStyles = theme => ({
  root: {
    display: 'grid',
    width: '100vw',
    height: '100vh',
    gridTemplateColumns: '240px auto 120px',
    //  gridTemplateColumns: 'repeat(12,1fr)',
    gridTemplateRows: '50px 1fr 100px',
    gridGap: theme.spacing(1)
  },
  cell: {
    padding: '5px',
    whiteSpace: 'prep',
    fontFamily: 'monospace'
  }
});
/// DEBUGGING STUFF ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// debugging stuff
let X = 0;
let INC = 1;
const ZIP = '=@=';
const ZIP_BLNK = ''.padEnd(ZIP.length, ' ');
UR.SystemHook('SIM', 'VIS_UPDATE', frameCount => {
  HCON.plot(`framecount: ${frameCount}`, 1);
  if (frameCount % 6) return;
  HCON.plot(ZIP_BLNK, 3, X);
  X += INC;
  HCON.plot(ZIP, 3, X);
  const XS = `${X}`.padStart(3, ' ');
  HCON.plot(`X: ${XS}`, 5);
  if (X < 1) INC = 1;
  if (X > 24) INC = -1;
  if (Math.random() > 0.5) {
    HCON.gotoRow(6);
    HCON.print(`dummy datalog: ${Math.random().toFixed(2)}`);
  }
  if (Math.random() > 0.95) HCON.clear(6);
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// END DEBUGGING STUFF ///////////////////////////////////////////////////////

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class Tracker extends React.Component {
  componentDidMount() {
    // start URSYS
    UR.SystemConfig({ autoRun: true });
    // initialize renderer
    const renderRoot = document.getElementById('root-renderer');
    Init(renderRoot);
    HookResize(window);
  }

  componentWillUnmount() {
    console.log('componentWillUnmount Tracker');
  }

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <div
          id="console-top"
          className={classes.cell}
          style={{
            gridColumnEnd: 'span 3',
            color: 'white',
            backgroundColor: BG_TITLE
          }}
        >
          <span style={{ fontSize: '32px' }}>FAKETRACK/TEST</span>
        </div>
        <div
          id="console-left"
          className={classes.cell}
          style={{ gridColumnEnd: 'span 1', backgroundColor: BG_COLOR }}
        >
          console-left
        </div>
        <div
          id="root-renderer"
          style={{
            gridColumnEnd: 'span 1',
            position: 'relative',
            width: '100%',
            height: '100%'
          }}
        >
          mid
        </div>
        <div
          id="console-right"
          className={classes.cell}
          style={{ gridColumnEnd: 'span 1', backgroundColor: BG_COLOR }}
        >
          console-right
        </div>
        <div
          id="console-bottom"
          className={classes.cell}
          style={{ gridColumnEnd: 'span 3', backgroundColor: BG_COLOR }}
        >
          console-bottom
        </div>
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStyles)(Tracker);
