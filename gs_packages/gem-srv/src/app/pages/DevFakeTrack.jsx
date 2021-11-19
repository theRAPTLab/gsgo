/* eslint-disable react/no-unused-state */
/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  FakeTrack - Main Application View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import UR from '@gemstep/ursys/client';
import { Init, HookResize } from '../../modules/render/api-render';
import FormTransform from './components/FormTransform';
import * as MOD from './helpers/dev-faketrack-ui';
import { useStylesHOC } from './helpers/page-styles';
import '../../lib/css/tracker.css';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
/// import '../modules/sim/runtime';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('FAKETR' /*'TagInput'*/);

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
      // ui controls
      num_entities: 2,
      prefix: 'f',
      jitter: 1,
      burst: false,
      // entity list
      status: 'entity status',
      // transform data
      xRange: 2,
      yRange: 2,
      xOff: 0,
      yOff: 0,
      xScale: 1,
      yScale: 1,
      zRot: 0,
      // frame information
      mprop: false,
      data_track: 'fake_tracks',
      data_object_name: 'bb_g'
    };
  }

  componentDidMount() {
    // start URSYS
    UR.SystemAppConfig({ autoRun: true }); // initialize renderer
    MOD.Initialize(this);
    HookResize(window);
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
    MOD.HandleStateChange(name, value);
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
        <div
          id="console-top"
          className={clsx(classes.cell, classes.top, classes.devBG)}
        >
          <span style={{ fontSize: '32px' }}>DEV/FAKETRACK</span>{' '}
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
              style={{ xRange: '40px' }}
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
                style={{ xRange: '60px' }}
                type="text"
                value={this.state.prefix}
                onChange={this.handleInputChange}
              />{' '}
              Prefix
            </label>
            <label>
              <input
                name="jitter"
                style={{ xRange: '40px' }}
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
          style={{ xRange: '720px', height: '720px' }}
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
          <FormTransform />
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
