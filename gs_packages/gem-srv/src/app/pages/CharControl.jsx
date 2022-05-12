/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  CharController - Main Application View
  This is based on FakeTrack testbed for GEMSTEP, which is not feature
  complete

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';

import UR from '@gemstep/ursys/client';
import { Init, HookResize } from '../../modules/render/api-render';
import {
  Initialize,
  HandleStateChange,
  UpdateDimensions
} from './helpers/mod-charcontrol-ui';
import { useStylesHOC } from './helpers/page-xui-styles';
import './scrollbar.css';
import '../../lib/css/charcontrol.css';
import PanelSimViewer from './components/PanelSimViewer';
import DialogConfirm from './components/DialogConfirm';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
/// import '../modules/sim/runtime';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('CHARCTRL' /*'TagInput'*/);
const DBG = false;
const MATRIX_INPUT_WIDTH = 50;
const SENDING_FPS = 25; // Match pozyx rate

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class CharController extends React.Component {
  constructor(props) {
    super(props);
    // save instance of mod_charctrl
    if (typeof props.controller === 'object') {
      this.controller = props.controller;
      console.log('CharController.jsx assigned controller', this.controller);
    }
    // establish state here
    // which is changed through setState() call of React.Component
    this.state = {
      isReady: false, // project data has been successfully retrieved
      noMain: true,
      tag: '',
      tags: [],
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
    this.init = this.init.bind(this);
    this.updateCharControlBpidList = this.updateCharControlBpidList.bind(this);
    this.handleSetCharControlBpidList =
      this.handleSetCharControlBpidList.bind(this);
    this.requestBPNames = this.requestBPNames.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    UR.HandleMessage(
      'NET:SET_CHARCONTROL_BPIDLIST',
      this.handleSetCharControlBpidList
    );
  }

  componentDidMount() {
    document.title = 'GEMSTEP Controller';

    // start URSYS
    UR.SystemAppConfig({ autoRun: true }); // initialize renderer
    HookResize(window);

    // Update size of controller canvas and entities
    window.addEventListener('resize', UpdateDimensions);

    UR.HookPhase('UR/APP_START', async () => {
      const devAPI = UR.SubscribeDeviceSpec({
        selectify: device => device.meta.uclass === 'Sim',
        notify: deviceLists => {
          const { selected, quantified, valid } = deviceLists;
          if (valid) {
            if (DBG) console.log(...PR('Main Sim Online!'));
            this.init();
            this.setState({ noMain: false });
          } else {
            this.setState({ noMain: true });
          }
        }
      });
    });
  }

  componentWillUnmount() {
    if (DBG) console.log(...PR('componentWillUnmount'));
    UR.UnhandleMessage(
      'NET:SET_CHARCONTROL_BPIDLIST',
      this.handleSetCharControlBpidList
    );
  }

  init() {
    if (this.state.isReady) return; // already initialized
    this.requestBPNames();
    UR.RaiseMessage('INIT_RENDERER'); // Tell PanelSimViewer to request boundaries
    this.setState({ isReady: true });
  }

  updateCharControlBpidList(bpnames) {
    if (DBG) console.log(...PR('setInputBPNames', bpnames));
    // TAGS is in mod-charcontrol-ui.js
    const tags = bpnames.map(b => ({ 'id': `bp_${b}`, 'label': b }));
    this.setState(
      state => ({
        tags,
        tag: state.tag || (tags.length > 0 ? tags[0].id : '')
        // keep currently selected tag, or default to first tag
      }),
      () => Initialize(this, { sampleRate: SENDING_FPS })
    );
  }

  // URSYS Handler
  handleSetCharControlBpidList(data) {
    if (DBG) console.log(...PR('handleSetInputBPNames', data));
    this.updateCharControlBpidList(data.bpnames);
  }

  // Direct Call
  requestBPNames() {
    // Wait for Main to load before requesting
    // Also, request after APP_RUN (URSYS Is loaded) otherwise the response
    // will come back before we're ready
    if (DBG) console.log(...PR('requestBPNames'));
    UR.CallMessage('NET:REQ_PROJDATA', {
      fnName: 'GetCharControlBpNames'
    }).then(rdata => this.updateCharControlBpidList(rdata.result));
  }

  // FORM CHANGE METHOD
  // state change handler (required for React form inputs)
  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    if (DBG) console.log(...PR('selected', name, value));
    HandleStateChange(name, value);
  }

  render() {
    const { noMain, tag, tags } = this.state;
    const controlNames = [{ 'id': 'markers', 'label': 'markers' }];
    const { classes } = this.props;
    const selectedTag = tag || (tags.length > 0 && tags[0]) || '';

    const DialogNoMain = (
      <DialogConfirm
        open={noMain}
        message={`Waiting for a "Main" project to load...`}
        yesMessage=""
        noMessage=""
      />
    );
    //
    return (
      <div
        className={classes.root}
        style={{
          gridTemplateColumns: '50% 50%', // always fit
          gridTemplateRows: '30px auto 0',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        <div
          id="console-top"
          className={clsx(classes.cell, classes.top)}
          style={{
            gridColumnEnd: 'span 2',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr'
          }}
        >
          <div>
            <input
              name="num_entities"
              style={{ width: '50px' }}
              type="number"
              min="1"
              max="100"
              defaultValue={this.state.num_entities}
              onChange={this.handleInputChange}
            />{' '}
            <select
              id="tag"
              name="tag"
              value={selectedTag}
              onChange={this.handleInputChange}
              className="form-control"
            >
              {tags.map(option => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <label className="control-label">&nbsp;Character Type</label>
          </div>
          <div
            style={{ fontSize: '16px', lineHeight: '16px', textAlign: 'center' }}
          >
            Controller CC{UR.GetUAddressNumber()}
          </div>
          <div
            style={{
              lineHeight: '16px',
              textAlign: 'right',
              marginRight: '10px'
            }}
          >
            {UR.ConnectionString()}
          </div>
        </div>
        <div
          className={classes.main}
          id="container"
          style={{ gridColumnEnd: 'span 1' }}
        />
        <div
          id="console-right"
          className={classes.right}
          style={{
            boxSizing: 'border-box',
            gridColumnEnd: 'span 1',
            minWidth: '280px'
          }}
        >
          <PanelSimViewer id="sim" />
          {/*
          <div id="charctrl_id"></div>
            <p style={{ marginTop: 0 }}>Sample Rate = {this.state.rate}/sec </p>
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
        */}
        </div>
        <div
          id="console-bottom"
          className={clsx(classes.cell, classes.bottom)}
          style={{ gridColumnEnd: 'span 2' }}
        >
          {DialogNoMain}
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
