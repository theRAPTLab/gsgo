/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Generator - Main Application View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
import * as SIM from 'modules/sim/api-sim';

import UR from '@gemstep/ursys/client';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import SETTINGS from 'config/app.settings';
import * as DATACORE from 'modules/runtime-datacore';
import * as RENDERER from 'modules/render/api-render';
import { useStylesHOC } from './page-styles';

const PR = UR.PrefixUtil('Generator', 'TagGreen');
const DBG = true;

UR.SystemHook(
  'UR/LOAD_ASSETS',
  () =>
    new Promise((resolve, reject) => {
      if (DBG) console.log(...PR('LOADING ASSET MANIFEST @ UR/LOAD_ASSETS...'));
      (async () => {
        let map = await DATACORE.ASSETS_LoadManifest('static/assets.json');
        if (DBG) console.log(...PR('ASSETS LOADED'));
        SIM.StartSimulation();
        if (DBG) console.log(...PR('SIMULATION STARTED'));
      })();
      resolve();
    })
);
/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const HCON = UR.HTMLConsoleUtil('console-left');
const { PROJECT_NAME } = SETTINGS;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// END STATUS FAKERY /////////////////////////////////////////////////////////

UR.RegisterMessage('NET:HELLO', data => {
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
        <div id="console-left" className={clsx(classes.cell, classes.left)}>
          console-left
        </div>
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
