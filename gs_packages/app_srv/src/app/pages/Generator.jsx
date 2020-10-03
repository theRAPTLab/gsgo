/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Generator - Main Application View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';

import UR from '@gemstep/ursys/client';
import SETTINGS from 'config/app.settings';
import * as DATACORE from 'modules/runtime-datacore';
import * as RENDERER from 'modules/render/api-render';
import { useStylesHOC } from './page-styles';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
import * as SIM from '../modules/sim/api-sim';

UR.SystemHook(
  'UR',
  'LOAD_ASSETS',
  () =>
    new Promise((resolve, reject) => {
      console.log(...PR('LOADING ASSET MANIFEST...'));
      (async () => {
        let map = await DATACORE.ASSETS_LoadManifest('static/assets.json');
        console.log(...PR('ASSETS LOADED'));
        SIM.StartSimulation();
        console.log(...PR('SIMULATION STARTED'));
      })();
      resolve();
    })
);
/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('Generator', 'TagBlue');
const HCON = UR.HTMLConsoleUtil('console-left');
const { PROJECT_NAME } = SETTINGS;

/// CONSOLE-LEFT STATUS FAKERY ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// CONSOLE
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
/// END STATUS FAKERY /////////////////////////////////////////////////////////

UR.NetSubscribe('NET:HELLO', data => {
  console.log('NET:HELLO processing', data);
  return { str: 'generator got you' };
});

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class Generator extends React.Component {
  componentDidMount() {
    // start URSYS
    UR.SystemConfig({ autoRun: true });
    // initialize renderer
    const renderRoot = document.getElementById('root-renderer');
    RENDERER.SetGlobalConfig({ actable: true });
    RENDERER.Init(renderRoot);
    RENDERER.HookResize(window);
    document.title = 'GENERATOR';
  }

  componentWillUnmount() {
    console.log('componentWillUnmount');
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
