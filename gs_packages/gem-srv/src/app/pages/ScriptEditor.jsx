/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ScriptEditor - Edit Script Blueprints

  state.script is loaded
  1. UR/APP_START waits for Main to come online
  2. Initialize() calls RequestModel
  3. RequestModel requests model data via URSYS
  4. URSYS callback calls UpdateModelData
  5. UpdateModelData sets OnSelectScript
  6. OnSelectScript loads the actual script

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import UR from '@gemstep/ursys/client';

/// PANELS ////////////////////////////////////////////////////////////////////
import PanelSimViewer from './components/PanelSimViewer';
import PanelSelectAgent from './components/PanelSelectAgent';
import PanelScript from './components/PanelScript';
import PanelInstances from './components/PanelInstances';
import PanelMessage from './components/PanelMessage';
import DialogConfirm from './components/DialogConfirm';

/// TESTS /////////////////////////////////////////////////////////////////////
// import 'modules/tests/test-parser'; // test parser evaluation

// this is where classes.* for css are defined
import { useStylesHOC } from './helpers/page-xui-styles';
import './scrollbar.css';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SCRIPTEDITOR');
const DBG = false;

const SCRIPT_TEMPLATE = `# BLUEPRINT untitled
# TAG isCharControllable true
# TAG isPozyxControllable true
# TAG isPTrackControllable false
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'circle.json' 0
featCall Costume setScale 1
// useFeature Movement
# PROGRAM EVENT
// onEvent Tick [[ ]]
# PROGRAM UPDATE
// when xxx touches yyy [[ ]]`;

/// PANEL CONFIGURATIONS //////////////////////////////////////////////////////
const PANEL_CONFIG = new Map();
PANEL_CONFIG.set('select', '60% auto 0px'); // columns
PANEL_CONFIG.set('script', '60% auto 0px'); // columns
PANEL_CONFIG.set('sim', '60% auto 0px'); // columns

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class ScriptEditor extends React.Component {
  constructor() {
    super();
    this.state = {
      isReady: false,
      noMain: true,
      panelConfiguration: 'select',
      projId: '',
      model: {},
      bpName: '',
      script: '',
      instances: [],
      monitoredInstances: [],
      message: '',
      messageIsError: false
    };
    this.Initialize = this.Initialize.bind(this);
    this.CleanupComponents = this.CleanupComponents.bind(this);
    this.RequestModel = this.RequestModel.bind(this);
    this.HandleModelUpdate = this.HandleModelUpdate.bind(this);
    this.UpdateModelData = this.UpdateModelData.bind(this);
    this.UnRegisterInstances = this.UnRegisterInstances.bind(this);
    this.OnInstanceUpdate = this.OnInstanceUpdate.bind(this);
    this.OnInspectorUpdate = this.OnInspectorUpdate.bind(this);
    this.OnPanelClick = this.OnPanelClick.bind(this);
    this.OnSelectScript = this.OnSelectScript.bind(this);
    this.HandleScriptUpdate = this.HandleScriptUpdate.bind(this);
    this.PostSendMessage = this.PostSendMessage.bind(this);
    this.OnDebugMessage = this.OnDebugMessage.bind(this);
    // Sent by PanelSelectAgent
    UR.HandleMessage('SELECT_SCRIPT', this.OnSelectScript);
    UR.HandleMessage('NET:SCRIPT_UPDATE', this.HandleScriptUpdate);
    UR.HandleMessage('HACK_DEBUG_MESSAGE', this.OnDebugMessage);
    UR.HandleMessage('NET:UPDATE_MODEL', this.HandleModelUpdate);
    UR.HandleMessage('NET:INSTANCES_UPDATE', this.OnInstanceUpdate);
    UR.HandleMessage('NET:INSPECTOR_UPDATE', this.OnInspectorUpdate);
  }

  componentDidMount() {
    if (DBG) console.log(...PR('componentDidMount'));
    const params = new URLSearchParams(window.location.search.substring(1));
    const projId = params.get('project');
    const bpName = params.get('script');
    document.title = `GEMSTEP SCRIPT EDITOR: ${projId}`;

    // start URSYS
    UR.SystemAppConfig({ autoRun: true });

    window.addEventListener('beforeunload', this.CleanupComponents);

    // Set model section
    let { panelConfiguration, script } = this.state;
    if (bpName === '') {
      // New Script
      panelConfiguration = 'script';
      script = SCRIPT_TEMPLATE;
    }
    this.setState({ panelConfiguration, projId, bpName, script });

    UR.HookPhase('UR/APP_START', async () => {
      const devAPI = UR.SubscribeDeviceSpec({
        selectify: device => device.meta.uclass === 'Sim',
        notify: deviceLists => {
          const { selected, quantified, valid } = deviceLists;
          if (valid) {
            if (DBG) console.log(...PR('Main Sim Online!'));
            this.Initialize();
            this.setState({ noMain: false });
          } else {
            this.setState({ noMain: true });
          }
        }
      });
    });
  }

  componentDidCatch(e) {
    console.log(e);
  }

  componentWillUnmount() {
    this.CleanupComponents();
    window.removeEventListener('beforeunload', this.CleanupComponents);
  }

  CleanupComponents() {
    this.UnRegisterInstances();
    UR.UnhandleMessage('SELECT_SCRIPT', this.OnSelectScript);
    UR.UnhandleMessage('NET:SCRIPT_UPDATE', this.HandleScriptUpdate);
    UR.UnhandleMessage('HACK_DEBUG_MESSAGE', this.OnDebugMessage);
    UR.UnhandleMessage('NET:UPDATE_MODEL', this.HandleModelUpdate);
    UR.UnhandleMessage('NET:INSTANCES_UPDATE', this.OnInstanceUpdate);
    UR.UnhandleMessage('NET:INSPECTOR_UPDATE', this.OnInspectorUpdate);
  }

  Initialize() {
    if (this.state.isReady) return; // already initialized
    const { projId } = this.state;
    this.RequestBpEditList(projId);
    UR.RaiseMessage('INIT_RENDERER'); // Tell PanelSimViewer to request boundaries
    this.setState({ isReady: true });
  }

  /**
   * This requests blueprint data from project-server used to populate
   * the list of editable blueprints.
   */
  RequestBpEditList(projId) {
    console.error(...PR('RequestBpEditList...', projId));
    if (DBG) console.log(...PR('RequestBpEditList...', projId));
    const fnName = 'RequestBpEditList';
    UR.CallMessage('NET:REQ_PROJDATA', {
      fnName,
      parms: [projId]
    }).then(rdata => {
      return this.UpdateBpEditList(rdata.result);
    });
  }

  /**
   * Locally store list of editable blueprints
   * and load the current script if it's been specified
   * @param {[{name, scriptText}]} bpEditList
   */
  UpdateBpEditList(bpEditList) {
    if (DBG) console.log(...PR('UpdateBpEditList', bpEditList));
    console.log(...PR('UpdateBpEditList', bpEditList));
    const { bpName } = this.state;
    this.setState({ bpEditList }, () => {
      if (bpName) {
        this.OnSelectScript({ bpName });
      }
    });
  }

  HandleProjectUpdate(data) {
    // Project data has been updated externally, re-request bp data if the
    // the updated project was what we have open
    const { projId } = this.state;
    console.error('ScriptEditor: MODEL UPDATE!', data, projId);
    if (data && data.project && data.project.id && data.project.id === projId)
      this.RequestBpEditList(projId);
  }

  UnRegisterInstances() {
    const { instances, monitoredInstances } = this.state;
    if (!instances) return;
    instances.forEach(i => {
      UR.RaiseMessage('NET:INSPECTOR_UNREGISTER', { id: i.id });
      monitoredInstances.splice(monitoredInstances.indexOf(i.id), 1);
    });
    this.setState({ monitoredInstances });
  }

  /**
   * Handler for `NET:INSTANCES_UPDATE`
   * NET:INSTANCES_UPDATE is sent by sim-agents.AgentsProgram after instances are created.
   * We use the list of instances created for this blueprint to register
   * the instances for inspector monitoring.
   * This is also called when other ScriptEditors on the network submit
   * scripts and trigger NET:INSTANCES_UPDATE.  In that situation,
   * we only update if the instance isn't already being monitored.
   * @param {Object} data { instances: [...instances]}
   *                       where 'instances' are instanceSpecs: {name, blueprint, init}
   */
  OnInstanceUpdate(data) {
    if (DBG) console.log(...PR('OnInstanceUpdate'));
    const { bpName, monitoredInstances } = this.state;
    // Only show instances for the current blueprint
    const instances = data.instances.filter(i => {
      return i.blueprint === bpName;
    });
    // Register the instances for monitoring
    instances.forEach(i => {
      if (monitoredInstances.includes(i.id)) return; // skip if already monitored
      UR.RaiseMessage('NET:INSPECTOR_REGISTER', {
        id: i.id
      });
      monitoredInstances.push(i.id);
    });
    this.setState({ instances, monitoredInstances });
  }

  /**
   * Handler for `NET:INSPECTOR_UPDATE`
   * NET:INSPECTOR_UPDATE is sent by PanelSimulation on every sim loop
   * with agent information for every registered instance
   * @param {Object} data { agents: [...agents]}
   *                 wHere `agents` are gagents
   */
  OnInspectorUpdate(data) {
    if (DBG) console.log(...PR('OnInspectorUpdate'));
    // Only show instances for the current blueprint
    const { bpName } = this.state;
    if (!data || data.agents === undefined) {
      console.error('OnInspectorUpdate got bad data', data);
      return;
    }
    const instances = data.agents.filter(i => {
      return i.blueprint.name === bpName;
    });
    this.setState({ instances });
  }

  OnPanelClick(id) {
    if (id === 'sim') return; // don't do anything if user clicks on sim panel
    this.setState({
      panelConfiguration: id
    });
  }

  /**
   * Call with stringId=undefined to go to selection screen
   * @param {string} data { bpName }
   */
  OnSelectScript(data) {
    const { bpName } = data;
    if (DBG) console.warn(...PR('OnSelectScript', data));
    this.UnRegisterInstances();
    const { model, projId } = this.state;
    if (model === undefined || model.blueprints === undefined) {
      console.warn(
        'ScriptEditor.OnSelectAgent: model or model.scripts is not defined',
        model
      );
      return; // no scripts defined
    }
    const bpDef = bpEditList.find(b => b.name === bpName);
    const script = bpDef ? bpDef.scriptText : SCRIPT_TEMPLATE;

    // add script to URL
    window.history.pushState(
      {},
      '',
      `/app/scripteditor?project=${projId}&script=${bpName}`
    );

    // Show script selector if bpName was not passed
    let panelConfiguration = 'script';
    if (bpName === undefined) {
      panelConfiguration = 'select';
    }

    this.setState({
      panelConfiguration,
      script,
      bpName
    });
  }

  HandleScriptUpdate(data) {
    const firstline = data.script.match(/.*/)[0];
    this.PostSendMessage(firstline);
  }

  PostSendMessage(text) {
    this.setState(state => ({
      message: `${
        state.message
      }${new Date().toLocaleTimeString()} :: Sent script ${text}\n`
    }));
  }

  OnDebugMessage(data) {
    this.setState({
      message: data.message,
      messageIsError: true
    });
  }

  /*  Renders 2-col, 3-row grid with TOP and BOTTOM spanning both columns.
   *  The base styles from page-styles are overidden with inline styles to
   *  make this happen.
   */
  render() {
    if (DBG) console.log(...PR('render'));
    const {
      noMain,
      panelConfiguration,
      projId,
      model,
      bpName,
      script,
      instances,
      message,
      messageIsError
    } = this.state;
    const { classes } = this.props;

    const DialogNoMain = (
      <DialogConfirm
        open={noMain}
        message={`Waiting for a "Main" project to load...`}
        yesMessage=""
        noMessage=""
      />
    );

    const agents =
      model && model.blueprints
        ? model.blueprints.map(s => ({ id: s.id, label: s.label }))
        : [];
    return (
      <div
        className={classes.root}
        style={{
          gridTemplateColumns: PANEL_CONFIG.get(panelConfiguration)
        }}
      >
        <div
          id="console-top"
          className={clsx(classes.cell, classes.top)}
          style={{ gridColumnEnd: 'span 3', display: 'flex' }}
        >
          <div style={{ flexGrow: '1' }}>
            <span style={{ fontSize: '32px' }}>SCRIPT EDITOR {projId}</span>
          </div>
          <button
            type="button"
            onClick={() => window.close()}
            className={classes.navButton}
          >
            CLOSE
          </button>
        </div>
        <div id="console-left" className={classes.left}>
          {panelConfiguration === 'select' && (
            <PanelSelectAgent
              id="select"
              agents={agents}
              modelId={projId}
              onClick={this.OnPanelClick}
            />
          )}
          {panelConfiguration === 'script' && (
            <PanelScript
              id="script"
              script={script}
              projId={projId}
              onClick={this.OnPanelClick}
            />
          )}
        </div>
        <div id="console-main" className={classes.main}>
          <PanelSimViewer id="sim" onClick={this.OnPanelClick} />
        </div>
        <div
          id="console-bottom"
          className={classes.bottom}
          style={{ gridColumnEnd: 'span 3' }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 3fr',
              columnGap: '5px',
              height: '100%',
              overflow: 'hidden'
            }}
          >
            <PanelMessage
              title="Log"
              message={message}
              isError={messageIsError}
            />
            <PanelInstances
              id="instances"
              instances={instances}
              disallowDeRegister
            />
            {DialogNoMain}
          </div>
        </div>
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStylesHOC)(ScriptEditor);
