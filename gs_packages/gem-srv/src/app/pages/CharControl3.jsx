/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  CharController3 - Main Application View

  Shows draggers on top of the simulation

  This is based on CharCtonrol, which is in tur based on
  FakeTrack testbed for GEMSTEP, which is not feature complete

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import ReactDOM from 'react-dom';
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
      rate: 0,
      dragContainerTop: 0,
      dragContainerHeight: 0,
      dragContainerLeft: 0,
      dragContainerWidth: 0
    };
    this.init = this.init.bind(this);
    this.updateLogSettings = this.updateLogSettings.bind(this);
    this.updateCharControlBpidList = this.updateCharControlBpidList.bind(this);
    this.handleSetCharControlBpidList =
      this.handleSetCharControlBpidList.bind(this);
    this.requestBPNames = this.requestBPNames.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.HandleResize = this.HandleResize.bind(this);
    this.RequestBoundary = this.RequestBoundary.bind(this);
    this.SetBoundary = this.SetBoundary.bind(this);
    this.HandleSetBoundary = this.HandleSetBoundary.bind(this);
    // Sent by parent after it knows the Main Sim project has loaded
    UR.HandleMessage('INIT_RENDERER', this.RequestBoundary);
    UR.HandleMessage(
      'NET:SET_CHARCONTROL_BPIDLIST',
      this.handleSetCharControlBpidList
    );
    UR.HandleMessage('NET:LOG_ENABLE', this.updateLogSettings);
  }

  componentDidMount() {
    document.title = 'GEMSTEP Controller';

    // start URSYS
    UR.SystemAppConfig({ autoRun: true }); // initialize renderer
    HookResize(window);

    // Update size of controller canvas and entities
    window.addEventListener('resize', this.HandleResize);

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
    UR.UnhandleMessage('INIT_RENDERER', this.RequestBoundary);
    UR.UnhandleMessage(
      'NET:SET_CHARCONTROL_BPIDLIST',
      this.handleSetCharControlBpidList
    );
    UR.UnhandleMessage('NET:LOG_ENABLE', this.updateLogSettings);
    window.removeEventListener('resize', this.HandleResize);
  }

  init() {
    if (this.state.isReady) return; // already initialized
    this.requestBPNames();
    UR.RaiseMessage('INIT_RENDERER'); // Tell PanelSimViewer to request boundaries
    this.setState({ isReady: true });
    UR.LogEvent('Session', ['CharController3 Connect']);
  }

  updateLogSettings(data) {
    UR.LogEnabled(data.enabled);
  }

  updateCharControlBpidList(bpnames) {
    if (DBG) console.log(...PR('setInputBPNames', bpnames));
    // TAGS is in mod-charcontrol-ui.js
    const tags = bpnames.map(b => ({ 'id': `bp_${b}`, 'label': b }));
    const defaultBPName =
      Array.isArray(bpnames) && bpnames.length > 0 ? `bp_${bpnames[0]}` : '';
    this.setState(
      state => ({
        tags,
        tag: state.tag || (tags.length > 0 ? tags[0].id : '')
        // keep currently selected tag, or default to first tag
      }),
      () => Initialize(this, { sampleRate: SENDING_FPS, defaultBPName })
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

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   *  The simulation bounds is set by each project.  So it needs to be updated
   *  whenever a project loads.  It also needs to be updated when the window
   *  resizes.
   */
  HandleResize() {
    this.RequestBoundary();
  }
  SetBoundary() {
    UpdateDimensions();
  }
  RequestBoundary() {
    UR.CallMessage('NET:REQ_PROJDATA', {
      fnName: 'GetProjectBoundary'
    }).then(this.HandleSetBoundary);
  }
  HandleSetBoundary(data) {
    const renderRoot = document.getElementById('root-renderer');
    // From api-render.RescaleToFit
    const projectWidth = data.result.width; // project settings width
    const projectHeight = data.result.height;
    const scaleFactor = Math.min(
      renderRoot.offsetWidth / projectWidth,
      renderRoot.offsetHeight / projectHeight
    );

    // account for navbar and title bar
    const navbarHeight = 30;
    const titleHeight = 17.3;
    const navbarAndTitleHeight = navbarHeight + titleHeight; // px

    const dragContainerWidth = projectWidth * scaleFactor;
    const dragContainerHeight = projectHeight * scaleFactor;

    let dragContainerLeft = (renderRoot.offsetWidth - dragContainerWidth) / 2;
    let dragContainerTop =
      navbarAndTitleHeight + (renderRoot.offsetHeight - dragContainerHeight) / 2;

    this.setState(
      {
        dragContainerTop,
        dragContainerHeight,
        dragContainerLeft,
        dragContainerWidth
      },
      () => this.SetBoundary()
    );
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  render() {
    const {
      noMain,
      tag,
      tags,
      dragContainerTop,
      dragContainerHeight,
      dragContainerLeft,
      dragContainerWidth
    } = this.state;
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

    return (
      <div
        className={classes.root}
        id="root"
        style={{
          gridTemplateColumns: '100%',
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
            gridTemplateColumns: '1fr 1fr 1fr',
            zIndex: 400
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
            />
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
        {/* ------------------------------------------------------------------------------ */}
        <PanelSimViewer id="sim" />
        <div
          style={{
            position: 'absolute',
            top: dragContainerTop,
            height: dragContainerHeight,
            left: dragContainerLeft,
            width: dragContainerWidth,
            backgroundColor: 'transparent'
          }}
          id="container"
        />
        {/* ------------------------------------------------------------------------------ */}
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
