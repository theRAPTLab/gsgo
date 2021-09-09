/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Main - Teacher/Admin/Projector interface

  * Manage network devices
  * Control simulation playback

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { withStyles } from '@material-ui/core/styles';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
import UR from '@gemstep/ursys/client';
import SIMCTRL from './elements/mod-sim-control';
import * as PROJSERVER from './elements/project-server';

/// PANELS ////////////////////////////////////////////////////////////////////
import MissionMapEditor from './MissionMapEditor';
import MissionRun from './MissionRun';
import PanelSimulation from './components/PanelSimulation';
import PanelPlayback from './components/PanelPlayback';
import PanelInstances from './components/PanelInstances';
import PanelMessage from './components/PanelMessage';
import DialogConfirm from './components/DialogConfirm';

import PanelTracker from './components/PanelTracker';
import FormTransform from './components/FormTransform';
import '../../lib/css/tracker.css';

/// TESTS /////////////////////////////////////////////////////////////////////
// import 'modules/tests/test-parser'; // test parser evaluation

/// STYLES ////////////////////////////////////////////////////////////////////
// this is where classes.* for css are defined
import { useStylesHOC } from './elements/page-xui-styles';
import './scrollbar.css';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('MAIN', 'TagRed');
const DBG = false;
let DEVICE_UDID;

/// PANEL CONFIGURATIONS //////////////////////////////////////////////////////
const PANEL_CONFIG = new Map();
PANEL_CONFIG.set('run', '15% auto 150px'); // columns
PANEL_CONFIG.set('run-map', '50% auto 150px'); // columns
PANEL_CONFIG.set('edit', '40% auto 0px'); // columns
PANEL_CONFIG.set('tracker', '0px auto 400px'); // columns

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class MissionControl extends React.Component {
  constructor() {
    super();
    const { bpidList } = UR.ReadFlatStateGroups('project');
    this.state = {
      panelConfiguration: 'run',
      message: '',
      projId: '', // set by project-data
      projectIsLoaded: false,
      bpidList,
      devices: [],
      inspectorInstances: [],
      runIsMinimized: true,
      scriptsNeedUpdate: false,
      openRedirectDialog: false,
      dialogMessage: undefined
    };

    // Initialization
    this.urStateUpdated = this.urStateUpdated.bind(this);
    this.GetUDID = this.GetUDID.bind(this);
    this.FailSimAlreadyRunning = this.FailSimAlreadyRunning.bind(this);

    // Devices
    this.UpdateDeviceList = this.UpdateDeviceList.bind(this);

    // Data Update Handlers
    this.HandleSimDataUpdate = this.HandleSimDataUpdate.bind(this);
    this.DoScriptUpdate = this.DoScriptUpdate.bind(this);
    this.DoSimStop = this.DoSimStop.bind(this);
    this.DoSimReset = this.DoSimReset.bind(this);
    this.OnInspectorUpdate = this.OnInspectorUpdate.bind(this);
    this.PostMessage = this.PostMessage.bind(this);
    this.DoShowMessage = this.DoShowMessage.bind(this);
    UR.HandleMessage('NET:UPDATE_MODEL', this.HandleSimDataUpdate);
    UR.HandleMessage('NET:SCRIPT_UPDATE', this.DoScriptUpdate);
    UR.HandleMessage('NET:HACK_SIM_STOP', this.DoSimStop);
    UR.HandleMessage('NET:HACK_SIM_RESET', this.DoSimReset);
    UR.HandleMessage('NET:INSPECTOR_UPDATE', this.OnInspectorUpdate);
    UR.HandleMessage('SHOW_MESSAGE', this.DoShowMessage);

    // Instance Interaction Handlers
    this.HandleDragEnd = this.HandleDragEnd.bind(this);
    this.HandleSimInstanceClick = this.HandleSimInstanceClick.bind(this);
    this.HandleSimInstanceHoverOver = this.HandleSimInstanceHoverOver.bind(this);
    this.HandleSimInstanceHoverOut = this.HandleSimInstanceHoverOut.bind(this);
    UR.HandleMessage('DRAG_END', this.HandleDragEnd);
    UR.HandleMessage('SIM_INSTANCE_CLICK', this.HandleSimInstanceClick);
    UR.HandleMessage('SIM_INSTANCE_HOVEROVER', this.HandleSimInstanceHoverOver);
    UR.HandleMessage('SIM_INSTANCE_HOVEROUT', this.HandleSimInstanceHoverOut);

    // Panel UI Configuration
    this.OnToggleRunEdit = this.OnToggleRunEdit.bind(this);
    this.OnToggleNetworkMapSize = this.OnToggleNetworkMapSize.bind(this);
    this.OnPanelClick = this.OnPanelClick.bind(this);
    this.OnSelectView = this.OnSelectView.bind(this);
    this.OnToggleTracker = this.OnToggleTracker.bind(this);
  }

  componentDidMount() {
    const params = new URLSearchParams(window.location.search.substring(1));
    const projId = params.get('project');

    // No project selected, go back to login to select project
    if (!projId) window.location = '/app/login';

    this.setState({ projId });

    // start URSYS
    UR.SystemAppConfig({ autoRun: true });

    UR.SubscribeState('project', this.urStateUpdated);

    // Prepare project-data for db load
    // We read the currently selected projId from the URL,
    // and prep project-data to load it.
    // project-data will load on UR/APP_START
    PROJSERVER.ProjectDataPreInit(this, projId);
  }

  componentDidCatch(e) {
    console.log(e);
  }

  componentWillUnmount() {
    UR.UnsubscribeState('project', this.urStateUpdated);
    UR.UnhandleMessage('UR_DEVICES_CHANGED', this.UpdateDeviceList);
    UR.UnhandleMessage('NET:UPDATE_MODEL', this.HandleSimDataUpdate);
    UR.UnhandleMessage('NET:SCRIPT_UPDATE', this.DoScriptUpdate);
    UR.UnhandleMessage('NET:INSTANCES_UPDATE', this.HandleInstancesUpdate);
    UR.UnhandleMessage('NET:HACK_SIM_STOP', this.DoSimStop);
    UR.UnhandleMessage('NET:HACK_SIM_RESET', this.DoSimReset);
    UR.UnhandleMessage('NET:INSPECTOR_UPDATE', this.OnInspectorUpdate);
    UR.UnhandleMessage('DRAG_END', this.HandleDragEnd);
    UR.UnhandleMessage('SIM_INSTANCE_CLICK', this.HandleSimInstanceClick);
    UR.UnhandleMessage('SIM_INSTANCE_HOVEROVER', this.HandleSimInstanceHoverOver);
    UR.UnhandleMessage('SIM_INSTANCE_HOVEROUT', this.HandleSimInstanceHoverOut);
    UR.UnhandleMessage('SHOW_MESSAGE', this.DoShowMessage);
  }

  GetUDID() {
    return DEVICE_UDID;
  }

  urStateUpdated(stateObj, cb) {
    const { project, bpidList } = stateObj;
    if (project) this.setState({ projectIsLoaded: true });
    if (bpidList) this.setState({ bpidList });
    if (typeof cb === 'function') cb();
  }

  FailSimAlreadyRunning() {
    const { projId } = this.state;
    this.setState({ openRedirectDialog: true });
    // redirect to project view
    window.location = `/app/project?project=${projId}&redirect`;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// DEVICE HANDLERS
  ///
  UpdateDeviceList(devices = []) {
    if (Array.isArray(devices)) {
      const UDID = this.GetUDID();
      const filtered = devices.filter(d => d.udid !== UDID); // remove self
      this.setState({ devices: filtered });
      return;
    }
    console.error(...PR('UDL error, got', devices));
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// DATA UPDATE HANDLERS
  ///
  HandleSimDataUpdate(data) {
    // REVIEW: This logic should probably be in mod-sim-control?
    if (DBG) console.log('HandleSimDataUpdate', data);
    console.log('HandleSimDataUpdate', data);
    if (
      SIMCTRL.IsRunning() || // Don't allow reset if sim is running
      SIMCTRL.RoundHasBeenStarted() // Don't allow reset after a Round has started
    ) {
      this.setState({ scriptsNeedUpdate: true });
      return; // skip update if it's already running
    }
    this.setState(
      { projId: data.projId },
      // Call Sim Places to recompile agents.
      () => SIMCTRL.SimPlaces(data.project)
    );
  }
  /**
   * User has submitted a new script, just update message
   * project-data handles script editing and instance creation
   * @param {object} data { script }
   */
  DoScriptUpdate(data) {
    const firstline = data.script.match(/.*/)[0];
    this.PostMessage(`Received script ${firstline}`);
    // HandleSimDataUpdate will set scriptNeedsUpdate flag
  }
  DoSimStop() {
    // Give it extra time after the "HACK_SIM_STOP" message is raised as the sim does not stop  immediately
    setTimeout(() => this.forceUpdate(), 250);
  }
  DoSimReset() {
    this.PostMessage('Simulation Reset!');
    if (SIMCTRL.IsRunning()) UR.RaiseMessage('NET:HACK_SIM_STOP'); // stop first
    this.setState(
      {
        inspectorInstances: [],
        scriptsNeedUpdate: false
      },
      () => {
        SIMCTRL.DoSimReset(); // First, clear state, then project-data.DoSimREset so they fire in order
        PROJSERVER.ReloadProject();
      }
    );
  }
  /**
   * Handler for `NET:INSPECTOR_UPDATE`
   * NET:INSPECTOR_UPDATE is sent by PanelSimulation on every sim loop
   * with agent information for every registered instance.
   * In order to keep data to a minimum, we don't pass the full data
   * for instances that haven't ben registered, just the bare minimum.
   * @param {Object} data { agents: [...agents]}
   *                 wHere `agents` are gagents
   */
  OnInspectorUpdate(data) {
    const { panelConfiguration } = this.state;
    // Don't do updates if we're editing the map
    // This triggers state changes, which causes InstanceEditor
    // and prop.tsx to re-render AMD text input fields to lose focus
    if (panelConfiguration === 'edit') return;

    if (!data || data.agents === undefined) {
      console.error('OnInspectorUpdate got bad data', data);
      return;
    }
    this.setState({ inspectorInstances: data.agents });
  }

  PostMessage(text) {
    this.setState(state => ({
      message: `${state.message}${new Date().toLocaleTimeString()} :: ${text}\n`
    }));
  }

  /// Displays GEM-SCRIPT scripted message on dialog
  DoShowMessage(data) {
    this.setState(state => {
      const messages = state.dialogMessage || [];
      messages.push(data.message);
      return { dialogMessage: messages };
    });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// INSTANCE INTERACTION HANDLERS
  ///
  HandleDragEnd(data) {
    const { panelConfiguration } = this.state;
    // Only update init if we're in edit mode
    if (panelConfiguration === 'edit') {
      const agent = data.agent;
      const { projId } = this.state;
      const x = Number.parseFloat(agent.prop.x.value).toFixed(2);
      const y = Number.parseFloat(agent.prop.y.value).toFixed(2);
      PROJSERVER.InstanceUpdatePosition({
        projId,
        instanceId: agent.id,
        updatedData: { x, y }
      });
    }
  }
  /**
   * User clicked on agent instance in simulation view
   * or User clicked on instance in MapEditor
   * If Map Editor is open, then when the user clicks
   * on an instance in the simulation view, we want to
   * select it for editing.
   * @param {object} data { agentId }
   */
  HandleSimInstanceClick(data) {
    const { panelConfiguration, projId } = this.state;
    // Only request instance edit in edit mode
    if (panelConfiguration === 'edit') {
      PROJSERVER.InstanceRequestEdit({ projId, agentId: data.agentId });
    } else {
      UR.RaiseMessage('INSPECTOR_CLICK', { id: data.agentId });
    }
  }
  HandleSimInstanceHoverOver(data) {
    const { projId } = this.state;
    PROJSERVER.InstanceHoverOver({ projId, agentId: data.agentId });
  }
  HandleSimInstanceHoverOut(data) {
    const { projId } = this.state;
    PROJSERVER.InstanceHoverOut({ projId, agentId: data.agentId });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// PANEL UI CONFIGURATION
  ///
  OnToggleRunEdit(e) {
    // Automatically trigger reset when changing modes.
    // This is necessary because blueprints are not recompiled
    // if scripts are submitted while the sim is running.
    // If the user then switches to edit the map, they may
    // inadvertently select newly defined properties that
    // the old instances do not support.  A reset will
    // cause the instances to be recompiled.
    // Always reset!  Otherwise, scale commands get re-applied?
    UR.RaiseMessage('NET:HACK_SIM_RESET');
    this.setState(state => ({
      panelConfiguration: state.panelConfiguration === 'edit' ? 'run' : 'edit'
    }));
    // Trigger Window Resize so that PanelSimulation will resize
    window.dispatchEvent(new Event('resize'));
  }
  OnToggleNetworkMapSize() {
    this.setState(state => ({
      panelConfiguration: state.panelConfiguration === 'run' ? 'run-map' : 'run',
      runIsMinimized: !state.runIsMinimized
    }));
  }
  OnPanelClick(id) {
    this.setState({
      panelConfiguration: id
    });
  }
  OnSelectView() {
    const { projId } = this.state;
    window.location = `/app/project?project=${projId}`;
  }
  OnToggleTracker() {
    this.setState(state => ({
      panelConfiguration:
        state.panelConfiguration !== 'tracker' ? 'tracker' : 'run'
    }));
    // Trigger Window Resize so that PanelSimulation will resize
    window.dispatchEvent(new Event('resize'));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// RENDER
  ///
  /*  Renders 2-col, 3-row grid with TOP and BOTTOM spanning both columns.
   *  The base styles from page-styles are overidden with inline styles to
   *  make this happen.
   */
  render() {
    const {
      panelConfiguration,
      message,
      projId,
      projectIsLoaded,
      bpidList,
      devices,
      inspectorInstances,
      runIsMinimized,
      scriptsNeedUpdate,
      openRedirectDialog,
      dialogMessage
    } = this.state;
    const { classes } = this.props;
    const { width, height, bgcolor } = PROJSERVER.GetBoundary();

    document.title = `GEMSTEP MAIN ${projId}`;

    const stageBtn = (
      <>
        <div className={classes.colorData} style={{ fontSize: '18px' }}>
          STAGE:{' '}
        </div>
        <button
          type="button"
          className={classes.button}
          onClick={this.OnToggleRunEdit}
          disabled={SIMCTRL.IsRunning()}
        >
          {panelConfiguration === 'edit' ? 'SAVE' : 'SETUP'}
        </button>
      </>
    );

    const jsxRunOrEdit = (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'baseline',
          height: '70px',
          width: '100%',
          marginBottom: '10px'
        }}
      >
        {stageBtn}
      </div>
    );

    const jsxLeft =
      panelConfiguration === 'edit' ? (
        <MissionMapEditor projId={projId} bpidList={bpidList} />
      ) : (
        <MissionRun
          projId={projId}
          bpidList={bpidList}
          devices={devices}
          toggleMinimized={this.OnToggleNetworkMapSize}
          minimized={runIsMinimized}
        />
      );

    const DialogMainRedirect = openRedirectDialog ? (
      <DialogConfirm
        open={openRedirectDialog}
        message={'A "Main" window is already open.  Redirecting...'}
        yesMessage=""
        noMessage=""
      />
    ) : (
      ''
    );

    // set zindex to show script message on top of system message
    const DialogMessage = dialogMessage ? (
      <DialogConfirm
        open={dialogMessage !== undefined}
        message={dialogMessage}
        onClose={() => this.setState({ dialogMessage: undefined })}
        yesMessage="OK"
        noMessage=""
      />
    ) : (
      ''
    );

    return (
      <div
        className={classes.root}
        style={{
          gridTemplateColumns: PANEL_CONFIG.get(panelConfiguration),
          gridTemplateRows: '50px auto 100px'
        }}
      >
        <div
          id="console-top"
          className={clsx(classes.cell, classes.top)}
          style={{ gridColumnEnd: 'span 3', display: 'flex' }}
        >
          <div style={{ flexGrow: '1' }}>
            <span style={{ fontSize: '32px' }}>MAIN {projId}</span>{' '}
            {UR.ConnectionString()}
            &emsp;
            <button type="button" onClick={this.OnToggleTracker}>
              tracker
            </button>
          </div>
          <Link
            to={{ pathname: `/app/project?project=${projId}` }}
            className={classes.navButton}
          >
            Back to PROJECT
          </Link>
        </div>
        <div
          id="console-left"
          className={classes.left} // commented out b/c adding a padding
          style={{ backgroundColor: 'transparent' }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateRows:
                panelConfiguration === 'edit' ? '70px auto' : '70px auto auto',
              overflow: 'hidden'
            }}
          >
            {jsxRunOrEdit}
            {jsxLeft}
          </div>
        </div>
        <div id="console-main" className={classes.main}>
          <PanelSimulation
            id="sim"
            width={width}
            height={height}
            bgcolor={bgcolor}
            onClick={this.OnPanelClick}
          />
        </div>
        <div id="console-right" className={classes.right}>
          <div
            style={{
              display: 'grid',
              gridTemplateRows: 'auto auto',
              overflow: 'hidden'
            }}
          >
            {panelConfiguration === 'tracker' && (
              <>
                <div className={classes.ioTransform}>
                  <FormTransform />
                </div>
                <PanelTracker />
              </>
            )}
            {panelConfiguration !== 'edit' && panelConfiguration !== 'tracker' && (
              <>
                <PanelPlayback
                  id="playback"
                  isDisabled={!projectIsLoaded}
                  needsUpdate={scriptsNeedUpdate}
                />
                <PanelInstances
                  id="instances"
                  instances={inspectorInstances}
                  disallowDeRegister={false}
                />
              </>
            )}
          </div>
        </div>
        <div
          id="console-bottom"
          className={classes.bottom}
          style={{ gridColumnEnd: 'span 3' }}
        >
          <PanelMessage message={message} />
          {DialogMainRedirect}
          {DialogMessage}
        </div>
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStylesHOC)(MissionControl);
