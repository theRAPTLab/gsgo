/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Tracker - Main Application View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';

import UR from '@gemstep/ursys/client';
import { useStylesHOC } from './page-styles';
import SETTINGS from '../../../config/app.settings';
import { Init, HookResize } from '../modules/sim/display/renderer';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
import '../modules/sim/runtime';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('Generator', 'TagBlue');
const HCON = UR.HTMLConsoleUtil('console-left');
const { PROJECT_NAME } = SETTINGS;

/// HACK DEBUGGING STUFF //////////////////////////////////////////////////////
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
class Generator extends React.Component {
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
        <div id="console-top" className={clsx(classes.cell, classes.top)}>
          <span style={{ fontSize: '32px' }}>GENERATOR/TEST</span>
        </div>
        <div id="console-left" className={clsx(classes.cell, classes.left)} />
        <div id="root-renderer" className={classes.main} />
        <div id="console-right" className={clsx(classes.cell, classes.right)}>
          console-right
        </div>
        <div id="console-bottom" className={clsx(classes.cell, classes.bottom)}>
          console-bottom
        </div>
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStylesHOC)(Generator);
