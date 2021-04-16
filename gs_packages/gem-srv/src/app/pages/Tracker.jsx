/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Tracker - Main Application View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';

// SELECT RUNTIME MODULES FOR APP
import * as INPUT from '../../modules/input/api-input';
import * as RENDERER from '../../modules/render/api-render';
import * as GLOBAL from '../../modules/datacore/dc-globals';
//
import { useStylesHOC } from './elements/page-styles';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TRACKER' /* 'TagApp' */);
const FCON = UR.HTMLConsoleUtil('console-bottom');
let ASSETS_LOADED = false;
let bad_keyer = 0; // use to generate unique keys
let INTERVAL;

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HookPhase(
  'UR/LOAD_ASSETS',
  () =>
    new Promise((resolve, reject) => {
      console.log(...PR('LOADING ASSET MANIFEST...'));
      (async () => {
        await GLOBAL.LoadAssetsSync('static/assets.json');
        console.log(...PR('ASSETS LOADED'));
        ASSETS_LOADED = true;
        resolve();
      })();
    })
);

/// DISPLAY LIST TESTS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let updateCount = 0;
UR.HandleMessage('NET:DISPLAY_LIST', remoteList => {
  if (ASSETS_LOADED) {
    FCON.plot(
      `${updateCount++} NET:DISPLAY_LIST received ${
        remoteList.length
      } DOBJs by TRACKER`,
      0
    );
    RENDERER.UpdateDisplayList(remoteList);
    RENDERER.Render();
  }
});

/// MESSAGER TEST HANDLER /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HandleMessage('NET:HELLO', data => {
  console.log('NET:HELLO processing', data);
  return { str: 'tracker got you' };
});

/// UTILITIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_GetDeviceArray(pattern = {}) {
  const devices = ['replace with fetch of devices call'];
  return devices;
}

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class Tracker extends React.Component {
  constructor() {
    super();
    this.state = {
      devices: []
    };
    this.updateDeviceList = this.updateDeviceList.bind(this);
    UR.HandleMessage('UR_DEVICES_CHANGED', this.updateDeviceList);
  }

  componentDidMount() {
    // start URSYS
    UR.SystemAppConfig({ autoRun: true }); // initialize renderer
    const renderRoot = document.getElementById('root-renderer');
    RENDERER.SetGlobalConfig({ actable: false });
    RENDERER.Init(renderRoot);
    RENDERER.HookResize(window);
    document.title = 'TRACKER';
    this.updateDeviceList();
    UR.HookPhase('UR/APP_START', async () => {
      const devAPI = UR.SubscribeDevices({
        selectify: device => device.meta.uclass === 'CharControl',
        quantify: list => (list.length > 1 ? list : []),
        notify: changes => {
          const { valid, added, updated, removed } = changes;
          console.log(...PR('notify', changes));
        }
      });
      // these are all the device API calls
      // we need to move them outside of Tracker.jsx
      const { unsubscribe, getController, deviceNum } = devAPI;
      const { getInputs, getChanges, putOutputs } = getController('markers');
      if (INTERVAL === undefined) {
        INTERVAL = setInterval(() => {
          const objs = getInputs();
          console.log(objs.map(o => `(${o.x},${o.y})`).join(', '));
        }, 1000);
      }
    }); // end HookPhase
    console.log(...PR('mounted'));
  }

  componentWillUnmount() {
    console.log('componentWillUnmount');
    UR.UnhandleMessage('UR_DEVICES_CHANGED', this.updateDeviceList);
  }

  updateDeviceList() {
    const devices = m_GetDeviceArray({ uclass: 'FakeTrack' });
    this.setState({ devices });
    // console.log(...PR('devices', JSON.stringify(devices)));
  }

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.root}>
        <div id="console-top" className={clsx(classes.cell, classes.top)}>
          <span style={{ fontSize: '32px' }}>TRACKER/TEST</span>{' '}
          {UR.ConnectionString()}
        </div>
        <div id="console-left" className={clsx(classes.cell, classes.left)}>
          USE SHIFT-CLICK TO OPEN LINKS IN NEW WINDOW in CHROME
          <br />
          <a href="/app/compiler" target="_blank">
            spawn compiler
          </a>
          <br />
          <a href="/app/faketrack" target="_blank">
            spawn faketrack
          </a>
          <h3>FakeTrack Devices Found</h3>
          <ul>{this.state.devices}</ul>
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
export default withStyles(useStylesHOC)(Tracker);
