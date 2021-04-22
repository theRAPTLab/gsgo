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
const SAMPLE_FPS = 30;
const INTERVAL = (1 / SAMPLE_FPS) * 1000;
/// RUNTIME VARS //////////////////////////////////////////////////////////////
let ASSETS_LOADED = false;
let bad_keyer = 0; // use to generate unique keys
let FRAME_TIMER;
/// DEBUG UTILS ///////////////////////////////////////////////////////////////
const PR = UR.PrefixUtil('TRACKER', 'TagApp');
const FCON = UR.HTMLConsoleUtil('console-bottom');

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
      devices: 'pre string',
      entities: 'pre string'
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
    this.updateDeviceList([]);

    UR.HookPhase('UR/APP_START', async () => {
      // STEP 1 is to get a "deviceAPI" from a Device Subscription
      const devAPI = UR.SubscribeDeviceSpec({
        selectify: device => device.meta.uclass === 'CharControl',
        quantify: list => list,
        notify: changes => {
          const { valid, added, updated, removed } = changes;
          console.log(...PR('notify', changes));
        }
      });
      // STEP 2 is to grab the getController('name') method which we
      // can call any time we want without mucking about with device
      // interfaces
      const { getController, deviceNum, unsubscribe } = devAPI;
      const { getInputs, getChanges, putOutputs } = getController('markers');
      // there is no STEP 3!!!

      // PROTOTYPE INPUT TESTER ///////////////////////////////////////////////
      // these are all the device API calls for testing. Since Tracker does
      // not have a simulation loop to get getInputs(), we just use a timer
      // for testing.
      if (FRAME_TIMER === undefined) {
        FRAME_TIMER = setInterval(() => {
          // get all the current inputs
          const objs = getInputs().slice();
          objs.sort((a, b) => {
            if (a.id < b.id) return -1;
            else if (a.id > b.id) return 1;
            return 0;
          });
          // update the device entities list on the left side
          const entities = objs
            .map(o => {
              const id = `${o.id}`.padEnd(10, ' ');
              const x = o.x;
              const y = o.y;
              const xspc = x < 0 ? '' : ' ';
              const yspc = y < 0 ? '' : ' ';
              return `${id}(${xspc}${x}, ${yspc}${y})`;
            })
            .join('\n');
          this.setState({ entities });
        }, INTERVAL);
      }
    }); // end HookPhase
    console.log(...PR('mounted'));
  }

  componentWillUnmount() {
    console.log('componentWillUnmount');
    UR.UnhandleMessage('UR_DEVICES_CHANGED', this.updateDeviceList);
  }

  updateDeviceList(deviceList = []) {
    if (Array.isArray(deviceList)) {
      let devices = '';
      deviceList.forEach(d => {
        const { udid, inputs, outputs } = d;
        const istr = [...Object.keys(inputs)].join(', ');
        devices += `${udid} inputs:${istr}\n`;
      });
      this.setState({ devices });
      return;
    }
    console.log(...PR('UDL error, got', deviceList));
  }

  render() {
    const { classes } = this.props;

    return (
      <div
        className={classes.root}
        style={{
          gridTemplateColumns: '280px auto',
          gridTemplateRows: '50px 720px auto',
          boxSizing: 'border-box'
        }}
      >
        <div
          id="console-top"
          className={clsx(classes.cell, classes.top, classes.devBG)}
          style={{ gridColumnEnd: 'span 2' }}
        >
          <span style={{ fontSize: '32px' }}>DEV/TRACKER</span>{' '}
          {UR.ConnectionString()}
        </div>
        <div
          id="console-left"
          className={clsx(classes.cell, classes.left)}
          style={{
            boxSizing: 'border-box',
            gridColumnEnd: 'span 1',
            minWidth: '280px'
          }}
        >
          Tracker plots <i>FakeTrack</i> and <i>DisplayObjects</i> as well as look
          for <i>CharControl</i> devices at <b>{SAMPLE_FPS}</b> samples/sec.
          <p>
            <b>Devices Online</b>
          </p>
          <pre style={{ fontSize: 'smaller' }}>{this.state.devices}</pre>
          <p>
            <b>Devices Entities</b>
            <br />
            <span style={{ fontSize: 'smaller', fontStyle: 'italic' }}>
              device entities aren't rendered
            </span>
          </p>
          <pre style={{ fontSize: 'smaller' }}>{this.state.entities}</pre>
        </div>
        <div
          id="root-renderer"
          className={classes.main}
          style={{ width: '720px', height: '720px', gridColumnEnd: 'span 1' }}
        />
        <div
          id="console-bottom"
          className={clsx(classes.cell, classes.bottom)}
          style={{ gridColumnEnd: 'span 2' }}
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
export default withStyles(useStylesHOC)(Tracker);
