/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  FakeTrack - Main Application View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';

import UR from '@gemstep/ursys/client';
import { Init, HookResize } from 'modules/render/api-render';
import { Initialize, HandleStateChange } from './elements/mod-faketrack-ui';
import { useStylesHOC } from './elements/page-styles';
import 'lib/css/faketrack.css';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
/// import '../modules/sim/runtime';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('FAKETR', 'TagInput');
const AR = UR.PrefixUtil('REACT ', 'TagRainbow');

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class FakeTrack extends React.Component {
  constructor(props) {
    super(props);
    // save instance of mod_faketrack
    if (typeof props.controller === 'object') {
      this.controller = props.controller;
      console.log('FakeTrack.jsx assigned controller', this.controller);
    }
    // establish state here
    // which is changed through setState() call of React.Component
    this.state = {
      num_entities: 2,
      prefix: 'f',
      jitter: 1,
      burst: false,
      status: 'entity status',
      width: 2,
      depth: 2,
      offx: 0,
      offy: 0,
      // offz: 0,
      xscale: 1,
      yscale: 1,
      // zscale: 1,
      xrot: 0,
      yrot: 0,
      zrot: 0,
      mprop: false,
      data_track: 'fake_tracks',
      data_object_name: 'bb_g'
    };
  }

  componentDidMount() {
    // start URSYS
    UR.SystemAppConfig({ autoRun: true }); // initialize renderer
    Initialize(this);
    HookResize(window);

    // prototype device registration
    // a device declares what kind of device it is
    // and what data can be sent/received
    UR.HookPhase('UR/APP_READY', async () => {
      const regData = {
        device: {
          udid: 'uniquedeviceid',
          groups: { groupA: true },
          roles: { roleA: true }
        },
        user: {
          uauth: 'jwtoken',
          uname: "billy's input",
          student: {
            sid: 'student id',
            sname: 'student name'
          }
        },
        inputControls: [
          { control: 'x', type: 'axis' },
          { control: 'y', type: 'axis' },
          { control: 'h', type: 'float' },
          { control: 'jump', type: 'trigger' }
        ],
        outputControls: [{ control: 'volume', type: 'float' }]
      };
      // style two (note async in UR.HookPhase definition above)
      const regInfo = await UR.RegisterAsDevice('FakeTrak', regData);
      console.log('RegisterInputs() returned regInfo', regInfo);
    }); // end HookPhase
  }

  componentWillUnmount() {
    console.log('componentWillUnmount');
  }

  // FORM CHANGE METHOD
  // state change handler (required for React form inputs)
  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    HandleStateChange(name, value);
  }

  render() {
    const trackTypes = [
      { 'id': 'people_tracks', 'label': 'people_tracks' },
      { 'id': 'object_tracks', 'label': 'object_tracks' },
      { 'id': 'pose_tracks', 'label': 'pose_tracks' },
      { 'id': 'fake_tracks', 'label': 'fake_tracks' }
    ];
    const { classes } = this.props;
    //
    return (
      <div
        className={classes.root}
        style={{
          padding: '10px',
          gridTemplateColumns: '240px 720px auto',
          gridTemplateRows: '50px 720px auto'
        }}
      >
        <div id="console-top" className={clsx(classes.cell, classes.top)}>
          <span style={{ fontSize: '32px' }}>FAKETRACK PORT</span>{' '}
          {UR.ConnectionString()}
        </div>
        <div
          id="console-left"
          style={{ boxSizing: 'border-box' }}
          className={clsx(classes.cell, classes.left)}
        >
          <div id="faketrack_id" />
          <div id="faketrack_tests">
            <input
              name="num_entities"
              style={{ width: '40px' }}
              type="number"
              min="1"
              max="100"
              defaultValue={this.state.num_entities}
              onChange={this.handleInputChange}
            />{' '}
            <label>Num</label>
            <label>
              <input
                name="prefix"
                style={{ width: '60px' }}
                type="text"
                value={this.state.prefix}
                onChange={this.handleInputChange}
              />{' '}
              Prefix
            </label>
            <label>
              <input
                name="jitter"
                style={{ width: '40px' }}
                type="number"
                min="0"
                max="10"
                value={this.state.jitter}
                onChange={this.handleInputChange}
              />{' '}
              Jitter
            </label>
            <label>
              <input
                name="burst"
                type="checkbox"
                checked={this.state.burst}
                onChange={this.handleInputChange}
              />{' '}
              Burst
            </label>
            <label>
              <input
                name="mprop"
                type="checkbox"
                checked={this.state.mprop}
                onChange={this.handleInputChange}
              />{' '}
              Dummy Prop
            </label>
          </div>
        </div>
        <div
          className={classes.main}
          id="container"
          style={{ width: '720px', height: '720px' }}
        />
        <div
          id="console-right"
          className={clsx(classes.cell, classes.right)}
          style={{
            boxSizing: 'border-box',
            overflowX: 'scroll',
            whiteSpace: 'nowrap'
          }}
        >
          <div id="data_track_controls">
            <select
              id="data_track"
              name="data_track"
              value={this.state.data_track}
              onChange={this.handleInputChange}
              className="form-control"
            >
              {trackTypes.map(option => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <label className="control-label">&nbsp;Data Track</label>
            <br />
            <input
              name="data_object_name"
              placeholder="blue_green_box or arms_mid"
              type="text"
              value={this.state.data_object_name}
              onChange={this.handleInputChange}
            />
            <label className="control-label">&nbsp;Object/Pose Name</label>
          </div>
          <div id="faketrack_entities">
            <pre>{this.state.status}</pre>
          </div>
          <div id="faketrack_xform" style={{ clear: 'both' }}>
            <label style={{ width: 'auto' }}>Output Transformations</label>
            <br />
            <label>
              <input
                name="xscale"
                type="number"
                value={this.state.xscale}
                onChange={this.handleInputChange}
              />{' '}
              XSCALE
            </label>
            <label>
              <input
                name="yscale"
                type="number"
                value={this.state.yscale}
                onChange={this.handleInputChange}
              />{' '}
              YSCALE
            </label>
            <br />
            <label>
              <input
                name="xrot"
                type="number"
                value={this.state.xrot}
                onChange={this.handleInputChange}
              />{' '}
              X ROT
            </label>
            <label>
              <input
                name="yrot"
                type="number"
                value={this.state.yrot}
                onChange={this.handleInputChange}
              />{' '}
              Y ROT
            </label>
            <label>
              <input
                name="zrot"
                type="number"
                value={this.state.zrot}
                onChange={this.handleInputChange}
              />{' '}
              Z ROT
            </label>
            <br />
            <label>
              <input
                name="offx"
                type="number"
                value={this.state.offx}
                onChange={this.handleInputChange}
              />{' '}
              OFF-X{' '}
            </label>
            <label>
              <input
                name="offy"
                type="number"
                value={this.state.offy}
                onChange={this.handleInputChange}
              />{' '}
              OFF-Y
            </label>
            <br />
            <label>
              <input
                name="width"
                type="number"
                value={this.state.width || 5}
                onChange={this.handleInputChange}
              />{' '}
              WIDTH-X
            </label>
            <label>
              <input
                name="depth"
                type="number"
                value={this.state.depth || 5}
                onChange={this.handleInputChange}
              />{' '}
              DEPTH-Y
            </label>
          </div>
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
} // endclass

/// PHASE MACHINE INTERFACE ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HandleMessage('NET:GEM_FAKETRACKAPP', data => data);

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStylesHOC)(FakeTrack);
