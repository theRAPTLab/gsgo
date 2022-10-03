/* eslint-disable react/no-unused-state */
/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  CharController - Main Application View
  This is based on FakeTrack testbed for GEMSTEP, which is not feature
  complete

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// REACT & MATERIAL UI STUFF /////////////////////////////////////////////////
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
/// URSYS STUFF ///////////////////////////////////////////////////////////////
import UR from '@gemstep/ursys/client';
import { Init, HookResize } from '../../modules/render/api-render';
import * as MOD from './helpers/dev-controller-ui';
import { useStylesHOC } from './helpers/page-styles';
import '../../lib/css/charcontrol.css';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('CHARCTRL', 'TagInput');
const MATRIX_INPUT_WIDTH = 50;
const SENDING_FPS = 15;
const log = console.log;

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class CharController extends React.Component {
  constructor(props) {
    super(props);
    // save instance of mod_charctrl if one is passed
    if (typeof props.controller === 'object') {
      this.controller = props.controller;
      log(...PR('CharController.jsx assigned controller', this.controller));
    }
    // establish state here
    // which is changed through setState() call of React.Component
    this.state = {
      num_entities: 1,
      prefix: '',
      jitter: 0,
      burst: false,
      status: '-',
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
      ctrl_name: '-',
      data_object_name: '-',
      rate: 0
    };
  }

  componentDidMount() {
    // start URSYS
    UR.SystemAppConfig({ autoRun: true }); // initialize renderer
    MOD.Initialize(this, { sampleRate: SENDING_FPS });
    HookResize(window);
    UR.Query(
      `
    query getLocales {
      locales {
        id
        name
      }
    }
    `
    ).then(data => log('test: gql locales returned', data.data.locales));
  }

  componentWillUnmount() {
    log('componentWillUnmount');
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
    const controlNames = [{ 'id': 'markers', 'label': 'markers' }];
    const { classes } = this.props;
    //
    return (
      <div
        className={classes.root}
        style={{
          gridTemplateColumns: '720px auto',
          gridTemplateRows: '50px 720px auto',
          boxSizing: 'border-box'
        }}
      >
        <div
          id="console-top"
          className={clsx(classes.cell, classes.top, classes.devBG)}
          style={{ gridColumnEnd: 'span 2' }}
        >
          <span style={{ fontSize: '32px' }}>DEV/CONTROLLER</span>{' '}
          {UR.ConnectionString()}
        </div>
        <div
          className={classes.main}
          id="container"
          style={{ width: '720px', height: '720px', gridColumnEnd: 'span 1' }}
        />
        <div
          id="console-right"
          className={clsx(classes.cell, classes.right)}
          style={{
            boxSizing: 'border-box',
            gridColumnEnd: 'span 1',
            minWidth: '280px'
          }}
        >
          <div id="charctrl_id" />
          <p style={{ marginTop: 0 }}>Output Rate = {this.state.rate}/sec </p>
          <div id="charctrl_tests">
            <input
              name="num_entities"
              style={{ width: '50px' }}
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
            <br />
            <label>
              <input
                name="jitter"
                style={{ width: '50px' }}
                type="number"
                min="0"
                max="10"
                value={this.state.jitter}
                onChange={this.handleInputChange}
              />{' '}
              Jitter
            </label>
            <br />
            <label style={{ marginTop: '1em' }}>
              <input
                name="burst"
                type="checkbox"
                checked={this.state.burst}
                onChange={this.handleInputChange}
              />{' '}
              Do Burst
            </label>
            <br />
            <div id="data_track_controls" style={{ marginTop: '1em' }}>
              <select
                id="ctrl_name"
                name="ctrl_name"
                value={this.state.ctrl_name}
                onChange={this.handleInputChange}
                className="form-control"
              >
                {controlNames.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <label className="control-label">&nbsp;ControlName</label>
            </div>
            <p style={{}}>
              Normalized Output ID X,Y
              <br />
              <span style={{ fontSize: 'smaller', fontStyle: 'italic' }}>
                nominal range is -0.5 to +0.5
              </span>
            </p>
            <pre style={{ margin: 0, padding: 0 }}>{this.state.status}</pre>
            <div id="charctrl_xform" style={{ clear: 'both' }}>
              <p style={{ marginTop: '1.5em' }}>
                Output Transformations
                <br />
                <span style={{ fontSize: 'smaller', fontStyle: 'italic' }}>
                  sim usually expects -1 to +1 range
                </span>
              </p>

              <label>
                <input
                  name="xscale"
                  style={{ width: `${MATRIX_INPUT_WIDTH}px` }}
                  type="number"
                  value={this.state.xscale}
                  onChange={this.handleInputChange}
                />{' '}
                XSCALE
              </label>
              <label>
                <input
                  name="yscale"
                  style={{ width: `${MATRIX_INPUT_WIDTH}px` }}
                  type="number"
                  value={this.state.yscale}
                  onChange={this.handleInputChange}
                />{' '}
                YSCALE
              </label>
              <br />
              <label>
                <input
                  name="offx"
                  style={{ width: `${MATRIX_INPUT_WIDTH}px` }}
                  type="number"
                  value={this.state.offx}
                  onChange={this.handleInputChange}
                />{' '}
                OFF-X{' '}
              </label>
              <label>
                <input
                  name="offy"
                  style={{ width: `${MATRIX_INPUT_WIDTH}px` }}
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
                  style={{ width: `${MATRIX_INPUT_WIDTH}px` }}
                  type="number"
                  value={this.state.width || 5}
                  onChange={this.handleInputChange}
                />{' '}
                WIDTH-X
              </label>
              <label>
                <input
                  name="depth"
                  style={{ width: `${MATRIX_INPUT_WIDTH}px` }}
                  type="number"
                  value={this.state.depth || 5}
                  onChange={this.handleInputChange}
                />{' '}
                DEPTH-Y
              </label>
            </div>
          </div>
        </div>
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
} // endclass

/// PHASE MACHINE INTERFACE ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HandleMessage('NET:GEM_CHARCTRLAPP', data => data);

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStylesHOC)(CharController);
