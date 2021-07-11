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
import FormTransform from './components/FormTransform';
import { useStylesHOC } from './elements/page-styles';
//
import '../../lib/css/tracker.css';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SAMPLE_FPS = 30;
const INTERVAL = (1 / SAMPLE_FPS) * 1000;
/// RUNTIME VARS //////////////////////////////////////////////////////////////
let ASSETS_LOADED = false;
let bad_keyer = 0; // use to generate unique keys
let FRAME_TIMER = 'make this undefined to start entity updates';
/// DEBUG UTILS ///////////////////////////////////////////////////////////////
const DBG = true;
const PR = UR.PrefixUtil('TRACKER', 'TagApp');

/// UTILITIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_GetDeviceArray(pattern = {}) {
  const devices = ['replace with fetch of devices call'];
  return devices;
}

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class DevTracker extends React.Component {
  constructor() {
    super();
    this.state = UR.GetState('locales', 'devices');
    console.log('DevTracker loaded state', this.state);
    this.updateDeviceList = this.updateDeviceList.bind(this);
    this.handleControlGroupChange = this.handleControlGroupChange.bind(this);
  }

  componentDidMount() {
    // start URSYS
    UR.SystemAppConfig({ autoRun: true }); // initialize renderer
    const renderRoot = document.getElementById('root-renderer');
    RENDERER.SetGlobalConfig({ actable: false });
    RENDERER.Init(renderRoot);
    RENDERER.HookResize(window);
    document.title = 'TRACKER';
    INPUT.StartTrackerVisuals();
    UR.HookPhase('UR/APP_START', async () => {
      // STEP 1 is to get a "deviceAPI" from a Device Subscription
      const devAPI = UR.SubscribeDeviceSpec({
        selectify: device => device.meta.uclass === 'CharControl',
        // if a function is not provided, you'll just get everything
        // quantify: list => list,
        notify: this.updateDeviceList
      });
      // STEP 2 is to grab the getController('name') method which we
      // can call any time we want without mucking about with device
      // interfaces
      const { getController, deviceNum, unsubscribe } = devAPI;
      const { getInputs, getChanges, putOutputs } = getController('markers');

      // PROTOTYPE INPUT TESTER ///////////////////////////////////////////////
      // these are all the device API calls for testing. Since Tracker does
      // not have a simulation loop to get getInputs(), we just use a timer
      // for testing.
      if (FRAME_TIMER === undefined) {
        FRAME_TIMER = setInterval(() => {
          // (1) DEVICE INTERFACE
          UR.GetDeviceDirectory();
          // get all the current inputs
          const objs = getInputs().slice();
          objs.sort((a, b) => {
            if (a.id < b.id) return -1;
            if (a.id > b.id) return 1;
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
          // (2) PTRACK INTERFACE
        }, INTERVAL);
      }
    }); // end HookPhase
    if (DBG) console.log(...PR('mounted'));
  }

  componentWillUnmount() {
    console.log('componentWillUnmount');
    UR.UnsubscribeState(this.handleStateUpdate);
    UR.UnhandleMessage('UR_DEVICES_CHANGED', this.updateDeviceList);
  }

  updateDeviceList(deviceLists) {
    const { selected, quantified, valid } = deviceLists;
    if (Array.isArray(quantified)) {
      console.log(...PR(`notify got ${quantified.length} qualified devices`));
      let devices = '';
      quantified.forEach(d => {
        const { udid, inputs, outputs } = d;
        const istr = [...Object.keys(inputs)].join(', ');
        devices += `${udid} inputs:${istr}\n`;
      });
      this.setState({ devices });
    }
  }

  handleControlGroupChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    // For now, the root of DevTracker (this component) only tracks selections
    // for other fields ('select'), they are handled in their own component
    // using a similar call to WriteStateChange()
    console.log('updating', name, value);
    UR.SetState('devices', name, value);
  }

  render() {
    const { classes } = this.props;
    const { currentControlGroup, controlGroupSelect } = this.state;

    return (
      <div
        className={classes.root}
        style={{
          gridTemplateColumns: '280px 720px auto',
          gridTemplateRows: '50px 720px auto',
          boxSizing: 'border-box'
        }}
      >
        <div
          id="console-top"
          className={clsx(classes.cell, classes.top, classes.devBG)}
          style={{ gridColumnEnd: 'span 3' }}
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
          Plots <i>FakeTrack</i> and <i>Display</i> entities. Lists{' '}
          <i>CharControl</i> entities.
          <br />
          <p>
            <b>Devices Online</b>
          </p>
          <pre style={{ fontSize: 'smaller' }}>{this.state.devices}</pre>
          <p>
            <b>Devices Entities</b>
            <br />
            <span style={{ fontSize: 'smaller', fontStyle: 'italic' }}>
              sample rate = {SAMPLE_FPS}/sec.
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
          id="console-right"
          className={clsx(classes.cell, classes.right)}
          style={{ gridColumnEnd: 'span 1' }}
        >
          <div className="io-track-controls">
            <select
              name="controlGroup"
              value={currentControlGroup}
              onChange={this.handleControlGroupChange}
              className={clsx('form-control', 'data-track')}
            >
              {controlGroupSelect.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <label className="control-label">&nbsp;Control Group</label>
          </div>
          <FormTransform title="Input Transform" />
        </div>
        <div
          id="console-bottom"
          className={clsx(classes.cell, classes.bottom)}
          style={{ gridColumnEnd: 'span 3' }}
        >
          console-bottom
        </div>
      </div>
    );
  }
}

/// PHASE MACHINE INTERFACES //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let updateCount = 0;
let FCON;
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
UR.HookPhase('UR/APP_RUN', () => {
  FCON = UR.HTMLConsoleUtil('console-bottom');
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
});

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStylesHOC)(DevTracker);
