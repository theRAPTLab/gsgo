/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ScriptEditor - Edit Script Blueprints

  state.script is loaded when
      1. UR/APP_START waits for Main to come online
      2. Initialize() calls RequestBpEditList
      3. RequestBpEditList requests model data via URSYS
      4. URSYS callback calls UpdateBpEditList
      5. UpdateBpEditList sets OnSelectScript
      6. OnSelectScript loads the actual script


      RATIONALE

    We want Main to be the traffic cop, so it can keep track of edit state
    and read/write permissions.  This method of loading also allows for
    temporary non-saved versions of project files/blueprint scripts.


  COMPONENT HIERARCHY

      The components are (oldname):

      Script Edit View

        ScriptEditor:root
          ScriptView_Pane:panel       (PanelScript)
            <codejar>                 aka ScriptViewCode_Block
            ScriptViewWiz_Block       (ScriptViewPane)
          ScriptLine_Pane:panel       (ScriptEditPane)
            SlotEditor_Block          (SelectEditorSlots)
              SlotEditorSelect_Block  (SelectEditor)

      Script Selector View

        PanelSelectBlueprint


  NEW BLUEPRINTS
      New blueprints can be created one of two ways:
      1. User clicks on "New Character Type" from Main
      2. User clicks on "ADD CHARACTER TYPE" from ScriptEditor's selection screen.

      Main: New Character Type
      This opens up a new ScriptEditor app tab with a blank script.

      Script Editor: ADD CHARACTER TYPE
      PanelSelectBlueprint raises SELECT_SCRIPT, and ScriptEditor's
      OnSelectScript handler loads a new script on an already
      open window.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import UR from '@gemstep/ursys/client';
import * as EDITMGR from 'modules/appcore/ac-editmgr';
import * as WIZCORE from 'modules/appcore/ac-wizcore';
import * as SLOTCORE from 'modules/appcore/ac-slotcore';
import * as TRANSPILER from 'script/transpiler-v2';
import * as SIMDATA from 'modules/datacore/dc-sim-data';

/// PANELS ////////////////////////////////////////////////////////////////////
// import PanelSimViewer from './components/PanelSimViewer';
import PanelSelectBlueprint from './components/PanelSelectBlueprint';
import PanelInstances from './components/PanelInstances';
import PanelMessage from './components/PanelMessage';
import DialogConfirm from './components/DialogConfirm';
import { SKIP_RELOAD_WARNING } from 'config/gem-settings';

/// WIZ GUI PANELS ////////////////////////////////////////////////////////////
import ScriptView_Pane from './wiz/gui/ScriptView_Pane';
import { ScriptLine_Pane } from './wiz/gui/ScriptLine_Pane';

/// DATA /////////////////////////////////////////////////////////////////////
/// Load RegisterWhenTests
import * as SIMCOND from 'modules/sim/sim-conditions'; // DO NOT REMOVE

/// TESTS /////////////////////////////////////////////////////////////////////
// import 'test/unit-parser'; // test parser evaluation

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
addFeature Costume
featCall agent.Costume setCostume 'circle.json' 0
featCall agent.Costume setScale 1
# PROGRAM EVENT
// every 5 runAfter [[ ]]
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
      bpEditList: [],
      bpName: '',
      script: '',
      instances: [],
      monitoredInstances: [],
      message: '',
      messageIsError: false,
      selection: ''
    };
    this.CleanupComponents = this.CleanupComponents.bind(this);
    this.Initialize = this.Initialize.bind(this);
    this.HandleEditMgrUpdate = this.HandleEditMgrUpdate.bind(this);
    this.RequestBpEditList = this.RequestBpEditList.bind(this);
    this.HandleProjectUpdate = this.HandleProjectUpdate.bind(this);
    this.HandleBlueprintsUpdate = this.HandleBlueprintsUpdate.bind(this);
    this.UpdateBpEditList = this.UpdateBpEditList.bind(this);
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
    UR.HandleMessage('NET:BLUEPRINTS_UPDATE', this.HandleBlueprintsUpdate);
    UR.HandleMessage('HACK_DEBUG_MESSAGE', this.OnDebugMessage);
    UR.HandleMessage('NET:UPDATE_MODEL', this.HandleProjectUpdate);
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

    window.addEventListener('beforeunload', e => {
      this.CleanupComponents();
      if (SKIP_RELOAD_WARNING) return;
      // Show "Leave site?" dialog
      e.preventDefault();
      e.returnValue = ''; // required by Chrome
      return e;
    });

    // add top-level click handler
    document.addEventListener('click', EDITMGR.DispatchClick);

    // state listeners
    EDITMGR.SubscribeState(this.HandleEditMgrUpdate);

    // don't bother subscribing to 'blueprints' changes
    // ac-blueprints is running on MAIN, not ScriptEditor so our
    // instance won't register change events
    // UR.SubscribeState('blueprints', this.UrBlueprintStateUpdated);

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
    EDITMGR.UnsubscribeState(handleEditMgrUpdate);
  }

  CleanupComponents() {
    this.UnRegisterInstances();
    UR.UnhandleMessage('SELECT_SCRIPT', this.OnSelectScript);
    UR.UnhandleMessage('NET:SCRIPT_UPDATE', this.HandleScriptUpdate);
    UR.UnhandleMessage('NET:BLUEPRINTS_UPDATE', this.HandleBlueprintsUpdate);
    UR.UnhandleMessage('HACK_DEBUG_MESSAGE', this.OnDebugMessage);
    UR.UnhandleMessage('NET:UPDATE_MODEL', this.HandleProjectUpdate);
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

  HandleEditMgrUpdate(vmStateEvent) {
    const { selection } = vmStateEvent;
    if (selection) this.setState({ selection });
  }

  /**
   * This requests blueprint data from project-server used to populate
   * the list of editable blueprints.
   */
  RequestBpEditList(projId) {
    if (DBG) console.log(...PR('RequestBpEditList...', projId));
    const fnName = 'RequestBpEditList';
    UR.CallMessage('NET:REQ_PROJDATA', {
      fnName,
      parms: [projId]
    }).then(rdata => {
      return this.UpdateBpEditList(rdata.result);
    });
  }

  /** needed to respond to blueprint deletion */
  HandleBlueprintsUpdate(data) {
    const { bpDefs } = data;
    if (Array.isArray(bpDefs) && bpDefs.length > 0)
      this.UpdateBpEditList(data.bpDefs);
  }

  /**
   * Locally store list of editable blueprints
   * and load the current script if it's been specified
   * @param {[{name, scriptText}]} bpEditList
   */
  UpdateBpEditList(bpEditList) {
    if (DBG) console.log(...PR('UpdateBpEditList', bpEditList));
    const { bpName } = this.state;
    // clear all bundles to remove deleted bundles
    SIMDATA.DeleteAllBlueprintBundles();
    bpEditList.forEach(thing => {
      const { name, scriptText } = thing;
      const script = TRANSPILER.TextToScript(scriptText);
      TRANSPILER.SymbolizeBlueprint(script);
    });
    this.setState({ bpEditList }, () => {
      // always call OnSelectScript.  if bpName is '', we load a blank TEMPLATE script
      this.OnSelectScript({ bpName });
    });
  }

  HandleProjectUpdate(data) {
    // Project data has been updated externally, re-request bp data if the
    // the updated project was what we have open
    const { projId } = this.state;
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
    // REVIEW: Instances are currently not displayed in
    // the ScriptEditor, so skip the setState
    // so that PanelScript does not re-render.
    // this.setState({ instances, monitoredInstances });
  }

  /**
   * Handler for `NET:INSPECTOR_UPDATE`
   * NET:INSPECTOR_UPDATE is sent by PanelSimulation on every sim loop
   * with agent information for every registered instance
   * @param {Object} data { agents: [...agents]}
   *                 wHere `agents` are gagents
   */
  OnInspectorUpdate(data) {
    // HACK Skip inspector updates to skip extra scriptEditor render
    // while testing ScriptViewPane integration
    return;

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
    this.setState(
      {
        panelConfiguration: id
      },
      () => EDITMGR.CancelSlotEdit()
    );
  }

  /**
   * Call with stringId=undefined to go to selection screen
   * @param {string} data { bpName }
   */
  OnSelectScript(data) {
    const { bpName } = data;
    if (DBG) console.warn(...PR('OnSelectScript', data));
    this.UnRegisterInstances();
    const { bpEditList = [], projId } = this.state;
    if (bpEditList === undefined || bpEditList.length < 1) {
      console.warn(
        'ScriptEditor.OnSelectAgent: No bpEditList to load',
        bpEditList
      );
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

    // Special WIZCORE handler to init state without triggering interceptState
    WIZCORE.SendState({ script_text: script, script_page_needs_saving: false });
    SLOTCORE.SendState({ slots_need_saving: false });

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
    const { noMain, panelConfiguration, projId, bpEditList, bpName, selection } =
      this.state;
    const { classes } = this.props;

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
        style={{
          gridTemplateColumns: PANEL_CONFIG.get(panelConfiguration),
          gridTemplateRows: '40px auto' // force hide bottom bar
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
            <PanelSelectBlueprint
              id="select"
              bpEditList={bpEditList}
              projId={projId}
              onClick={this.OnPanelClick}
            />
          )}
          {panelConfiguration === 'script' && (
            <ScriptView_Pane
              id="script"
              bpName={bpName}
              projId={projId}
              onClick={this.OnPanelClick}
            />
          )}
        </div>
        <div id="console-main" className={classes.main}>
          <ScriptLine_Pane selection={selection} />
          {/* <PanelSimViewer id="sim" onClick={this.OnPanelClick} /> */}
        </div>
        {/* Hidden by gridTemplateRows at root div
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
          </div>
        </div> */}
        {DialogNoMain}
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStylesHOC)(ScriptEditor);
