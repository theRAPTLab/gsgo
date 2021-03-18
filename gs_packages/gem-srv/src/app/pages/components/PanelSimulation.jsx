import React from 'react';
import UR from '@gemstep/ursys/client';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
import * as SIM from 'modules/sim/api-sim';
import * as GLOBAL from 'modules/datacore/dc-globals';
import * as DATACORE from 'modules/datacore';
import * as RENDERER from 'modules/render/api-render';
import * as TRANSPILER from 'script/transpiler';
import { GetAllAgents } from 'modules/datacore';

import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('PanelSimulation');
const DBG = false;

const MONITORED_INSTANCES = [];

/// URSYS SYSHOOKS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.SystemHook(
  'UR/LOAD_ASSETS',
  () =>
    new Promise((resolve, reject) => {
      if (DBG) console.log(...PR('LOADING ASSET MANIFEST @ UR/LOAD_ASSETS...'));
      (async () => {
        let map = await GLOBAL.LoadAssetsSync('static/assets.json');
        if (DBG) console.log(...PR('ASSETS LOADED'));
        resolve();
      })();
    })
);

class PanelSimulation extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Simulation'
    };
    this.DoRegisterInspector = this.DoRegisterInspector.bind(this);
    this.DoUnRegisterInspector = this.DoUnRegisterInspector.bind(this);
    this.DoInstanceInspectorUpdate = this.DoInstanceInspectorUpdate.bind(this);
    this.DoScriptUpdate = this.DoScriptUpdate.bind(this);
    this.DoSimReset = this.DoSimReset.bind(this);
    this.DoSimPlaces = this.DoSimPlaces.bind(this);
    this.DoSimStart = this.DoSimStart.bind(this);
    this.DoSimStop = this.DoSimStop.bind(this);

    UR.HandleMessage('NET:INSPECTOR_REGISTER', this.DoRegisterInspector);
    UR.HandleMessage('NET:INSPECTOR_UNREGISTER', this.DoUnRegisterInspector);
    UR.HandleMessage('NET:HACK_SCRIPT_UPDATE', this.DoScriptUpdate);
    UR.HandleMessage('NET:HACK_SIM_RESET', this.DoSimReset);
    UR.HandleMessage('*:SIM_PLACES', this.DoSimPlaces);
    UR.HandleMessage('NET:HACK_SIM_START', this.DoSimStart);
    UR.HandleMessage('NET:HACK_SIM_STOP', this.DoSimStop);

    UR.SystemHook('SIM/UI_UPDATE', this.DoInstanceInspectorUpdate);
  }

  componentDidMount() {
    // initialize renderer
    const renderRoot = document.getElementById('root-renderer');
    RENDERER.SetGlobalConfig({ actable: true });
    RENDERER.Init(renderRoot);
    RENDERER.HookResize(window);
  }

  componentWillUnmount() {
    UR.UnhandleMessage('NET:INSPECTOR_REGISTER', this.DoRegisterInspector);
    UR.UnhandleMessage('NET:INSPECTOR_UNREGISTER', this.DoUnRegisterInspector);
    UR.UnhandleMessage('NET:HACK_SCRIPT_UPDATE', this.DoScriptUpdate);
    UR.UnhandleMessage('NET:HACK_SIM_RESET', this.DoSimReset);
    UR.UnhandleMessage('*:SIM_PLACES', this.DoSimPlaces);
    UR.UnhandleMessage('NET:HACK_SIM_START', this.DoSimStart);
    UR.UnhandleMessage('NET:HACK_SIM_STOP', this.DoSimStop);
  }

  /**
   * PanelSimulation keeps track of any instances that have been requested
   * for inspector monitoring.
   * We allow duplicate registrations so that when one device unregisters,
   * the instance is still considered monitored.
   * @param {Object} data { name: <string> } where name is the agent name.
   */
  DoRegisterInspector(data) {
    const id = data.id;
    MONITORED_INSTANCES.push(id);
  }
  DoUnRegisterInspector(data) {
    const id = data.id;
    const i = MONITORED_INSTANCES.indexOf(id);
    if (i > -1) MONITORED_INSTANCES.splice(i, 1);
  }

  /**
   * On every system loop, we broadcast instance updates
   * for any instances that have registered for modeling.
   * We keep this list small to keep from flooding the net with data.
   */
  DoInstanceInspectorUpdate() {
    // walk down agents and broadcast results for monitored agents
    const agents = GetAllAgents();
    const inspectorAgents = agents.filter(a =>
      MONITORED_INSTANCES.includes(a.id)
    );
    // Broadcast data
    UR.RaiseMessage('NET:INSPECTOR_UPDATE', { agents: inspectorAgents });
  }

  /**
   * WARNING: Do not call this before the simulation has loaded.
   */
  DoSimReset() {
    DATACORE.DeleteAllTests();
    // DATACORE.DeleteAllGlobalConditions(); // removed in script-xp branch
    DATACORE.DeleteAllScriptEvents();
    DATACORE.DeleteAllAgents();
    DATACORE.DeleteAllInstances();
    SIM.Reset();
  }

  // See PanelScript.hackSendText for documentation of the whole call cycle
  DoScriptUpdate(data) {
    const { model } = this.props;
    if (!model) {
      console.error(...PR('No model selected.'));
      return;
    }
    const source = TRANSPILER.ScriptifyText(data.script);
    const bundle = TRANSPILER.CompileBlueprint(source);
    const bp = TRANSPILER.RegisterBlueprint(bundle);

    // Read Instances Def
    const instancesSpec = model.instances.filter(i => i.blueprint === bp.name);
    if (instancesSpec.length < 1) {
      // If the map has not been defined yet, then generate a single instance
      // instancesSpec.push({ name: `${bp.name}01`, init: '' });

      // REVIEW HACK
      // modelId is not available here?!?!
      const params = new URLSearchParams(window.location.search.substring(1));
      const modelId = params.get('model');

      UR.RaiseMessage('LOCAL:INSTANCE_ADD', {
        modelId,
        blueprintName: bp.name
      });
    }
  }

  DoSimPlaces() {
    // 1. Load Model
    //    model data is loaded by the parent container: MissionControl or MapEditor
    const { model } = this.props;

    // Skip if no model is loaded
    if (!model) return;

    // 2. Compile All Agents
    const scripts = model.scripts;
    const sources = scripts.map(s => TRANSPILER.ScriptifyText(s.script));
    const bundles = sources.map(s => TRANSPILER.CompileBlueprint(s));
    const blueprints = bundles.map(b => TRANSPILER.RegisterBlueprint(b));
    const blueprintNames = blueprints.map(b => b.name);

    // 3. Create All Instances
    const instancesSpec = model.instances;
    // Use 'UPDATE' so we don't clobber old instance values.
    UR.RaiseMessage('ALL_AGENTS_PROGRAM_UPDATE', {
      blueprintNames,
      instancesSpec
    });

    // 4. Places Alternative!  Just call AgentUpdate and RENDERER.Render
    UR.RaiseMessage('AGENTS_RENDER');
  }

  DoSimStart() {
    SIM.Start();
  }

  DoSimStop() {
    SIM.End();
  }

  render() {
    const { title } = this.state;
    const { id, model, isActive, onClick, classes } = this.props;

    return (
      <PanelChrome id={id} title={title} isActive={isActive} onClick={onClick}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexWrap: 'wrap',
            fontSize: '12px',
            height: '100%'
          }}
        >
          <div id="root-renderer" style={{ height: '100%' }}>
            Waiting for start...
          </div>
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelSimulation);
