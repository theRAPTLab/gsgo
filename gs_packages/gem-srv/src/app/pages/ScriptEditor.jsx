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
                EditSymbol_Block
                or
                ObjRefSelector_Block

      Script Selector View

        PanelSelectBlueprint


  NEW BLUEPRINTS
      New blueprints can be created one of three ways:
      1. User clicks on "NEW CHARACTER TYPE" from Main
      2. User clicks on "NEW CHARACTER TYPE" from ScriptEditor's selection screen.

      Main: New Character Type
      This opens up a new ScriptEditor app tab with a blank script url.

      Script Editor: NEW CHARACTER TYPE
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
import Dragger from './components/Dragger';

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
# TAG isPozyxControllable false
# TAG isPTrackControllable false

# PROGRAM INIT
addFeature Costume
featProp agent.Costume.costumeName setTo 'GEN_onexone.json'

# PROGRAM UPDATE
// code to run every frame
// when xxx touches yyy [[ ]]
// every 5 runAfter [[ ]]
// onEvent Tick [[ ]]

// COMMENT KEY
// 🔎 WHAT DOES THIS DO? heading
// 🔎 body
// ✏️ LETS CHANGE THIS: heading
// ✏️ body
`;

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
      projectWasSwitched: false,
      panelConfiguration: 'select',
      projId: '',
      bpEditList: [],
      bpName: '',
      script: '',
      instances: [],
      monitoredInstances: [],
      message: '',
      messageIsError: false,
      selection: '',
      scriptWidthPercent: 50
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
    this.SelectScript = this.SelectScript.bind(this);
    this.HandleScriptUpdate = this.HandleScriptUpdate.bind(this);
    this.PostSendMessage = this.PostSendMessage.bind(this);
    this.OnDebugMessage = this.OnDebugMessage.bind(this);
    this.HandleConfirmReload = this.HandleConfirmReload.bind(this);
    this.OnProjectMenuSelect = this.OnProjectMenuSelect.bind(this);
    this.OnDraggerUpdate = this.OnDraggerUpdate.bind(this);

    // Sent by PanelSelectAgent
    UR.HandleMessage('SELECT_SCRIPT', this.SelectScript);
    UR.HandleMessage('NET:SCRIPT_UPDATED', this.HandleScriptUpdate);
    UR.HandleMessage('NET:BLUEPRINTS_UPDATE', this.HandleBlueprintsUpdate);
    UR.HandleMessage('HACK_DEBUG_MESSAGE', this.OnDebugMessage);
    UR.HandleMessage('NET:UPDATE_MODEL', this.HandleProjectUpdate);
    UR.HandleMessage('NET:INSTANCES_UPDATE', this.OnInstanceUpdate);
    UR.HandleMessage('NET:INSPECTOR_UPDATE', this.OnInspectorUpdate);
  }

  componentDidMount() {
    if (DBG) console.log(...PR('componentDidMount'));

    // 1. INITIALIZE LISTENERS
    //    a. start URSYS
    UR.SystemAppConfig({ autoRun: true });
    //    b. APP HOOKS
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
    //    c. beforeunload
    window.addEventListener('beforeunload', e => {
      this.CleanupComponents();
      if (SKIP_RELOAD_WARNING) return;
      // Show "Leave site?" dialog
      const { script_page_needs_saving } = WIZCORE.State();
      const { slots_need_saving } = SLOTCORE.State();
      if (script_page_needs_saving || slots_need_saving) {
        e.preventDefault();
        e.returnValue = ''; // required by Chrome
        return e;
      }
      return;
    });
    //    d. add top-level click handler
    document.addEventListener('click', EDITMGR.DispatchClick);
    //    e. state listeners
    EDITMGR.SubscribeState(this.HandleEditMgrUpdate);
    // don't bother subscribing to 'blueprints' changes
    // ac-blueprints is running on MAIN, not ScriptEditor so our
    // instance won't register change events
    // UR.SubscribeState('blueprints', this.UrBlueprintStateUpdated);

    // 2. PROCESS URL
    const params = new URLSearchParams(window.location.search.substring(1));
    const projId = params.get('project');
    const bpName = params.get('script');
    document.title = bpName
      ? `"${bpName}" Editor`
      : `GEMSTEP SCRIPT EDITOR: ${projId}`;
    let { panelConfiguration, script } = this.state;
    if (bpName === '') {
      // New Script
      panelConfiguration = 'script';
      script = SCRIPT_TEMPLATE;
      this.setState(
        { panelConfiguration, projId, bpName, script },
        () => this.SelectScript({ bpName: '' }) // Call SelectScript immediately to pre-populate the script template
      );
      return;
    }
    this.setState({ panelConfiguration, projId, bpName, script });

    // NOTE: The script is selected with the UpdateBpEditList callback
    //       e.g. we select the script only after we receive the list of
    //       available scripts
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
    UR.UnhandleMessage('SELECT_SCRIPT', this.SelectScript);
    UR.UnhandleMessage('NET:SCRIPT_UPDATED', this.HandleScriptUpdate);
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
    const { selection, bpname } = vmStateEvent;
    if (selection) this.setState({ selection });
    if (bpname) {
      const { projId } = this.state;
      // add script to URL
      window.history.pushState(
        {},
        '',
        `/app/scripteditor?project=${projId}&script=${bpname}`
      );
      this.setState({ bpName: bpname });
    }
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
    // symbolize all blueprints!
    bpEditList.forEach(thing => {
      const { name, scriptText } = thing;
      const script = TRANSPILER.TextToScript(scriptText);
      TRANSPILER.SymbolizeBlueprint(script);
    });
    this.setState({ bpEditList }, () => {
      // make sure the script exists
      const bpExists = bpEditList.find(thing => thing.name === bpName);
      if (bpExists) {
        this.SelectScript({ bpName });
      } else {
        // script does not exist!  force selector
        this.setState({ bpName: null });
      }
    });
  }

  HandleProjectUpdate(data) {
    // Project data has been updated externally, re-request bp data if the
    // the updated project was what we have open
    const newProjId = (data && data.project && data.project.id) || '';
    const { projId } = this.state;
    // Main selected a new project?
    const projectWasSwitched = newProjId !== projId;
    if (projectWasSwitched) {
      // show project was switched dialog to inform reload
      this.setState({ projectWasSwitched, projId: newProjId });
    } else {
      // just update the list of bpNames
      this.RequestBpEditList(projId);
    }
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
   * Call with `data` undefined to go to selection screen
   * Call with bpName = '' to create a new script
   * Called by:
   *  - SELECT_SCRIPT via PanelSelectBlueprint
   *  - SELECT_SCRIPT after script deletion by ScriptView_Pane
   *  - SELECT_SCRIPT after wizcore save to server
   *  - HandleConfirmReload after project is switched by Main
   * @param {string} data { bpName }
   */
  SelectScript(data = {}) {
    const { bpName } = data;
    if (DBG) console.warn(...PR('SelectScript', data));
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

  // DialogaProjectSwitch User confirms reload
  HandleConfirmReload() {
    const { projId } = this.state;
    // add script to URL
    this.setState({ projectWasSwitched: false });
    this.SelectScript(); // force selector
  }

  OnProjectMenuSelect(event) {
    this.SelectScript({ bpName: event.target.value });
  }

  OnDraggerUpdate(ratio) {
    this.setState({ scriptWidthPercent: ratio * 100 });
  }

  /*  Renders 2-col, 3-row grid with TOP and BOTTOM spanning both columns.
   *  The base styles from page-styles are overidden with inline styles to
   *  make this happen.
   */
  render() {
    if (DBG) console.log(...PR('render'));
    const {
      noMain,
      projectWasSwitched,
      panelConfiguration,
      projId,
      bpEditList,
      bpName,
      selection,
      scriptWidthPercent
    } = this.state;
    const { classes } = this.props;

    const sortedBlueprints = bpEditList
      ? bpEditList.sort((a, b) => {
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          return 0;
        })
      : [];
    const ProjectSelectMenu = (
      <select
        value={bpName}
        onChange={this.OnProjectMenuSelect}
        className={classes.select}
        style={{ margin: '0 20px' }}
      >
        {sortedBlueprints.map(bp => (
          <option key={bp.name} value={bp.name}>
            {bp.name}
          </option>
        ))}
      </select>
    );

    const DialogNoMain = (
      <DialogConfirm
        open={noMain}
        message={`Waiting for a "Main" project to load...`}
        yesMessage=""
        noMessage=""
      />
    );

    const DialogProjectSwitch = (
      <DialogConfirm
        open={projectWasSwitched}
        message={`Main has switched to a new project "${projId}".  Please select a new Character to edit.`}
        yesMessage="OK"
        noMessage=""
        onClose={this.HandleConfirmReload}
      />
    );

    // Overrides PANEL_CONFIG's previously defined column proportions
    // PANEL_CONFIG is still being used to keep track of view state
    const GRID_COLUMNS = `${scriptWidthPercent}% auto 0px`;

    return (
      <div
        className={classes.root}
        style={{
          gridTemplateColumns: GRID_COLUMNS,
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
          {ProjectSelectMenu}
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
            // REVIEW: Ideally we would skip a ScriptView_Pane update when
            // bpEditList changes to prevent extra re-rendering
            <ScriptView_Pane
              id="script"
              bpName={bpName}
              projId={projId}
              onClick={this.OnPanelClick}
            />
          )}
        </div>
        <div id="console-main" className={classes.main}>
          <Dragger color="#064848" onDragUpdate={this.OnDraggerUpdate} />
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
        {DialogProjectSwitch}
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStylesHOC)(ScriptEditor);
