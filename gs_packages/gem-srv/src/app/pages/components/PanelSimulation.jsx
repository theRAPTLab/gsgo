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
      title: 'Simulation',
      model: {}
    };
    this.DoRegisterInspector = this.DoRegisterInspector.bind(this);
    this.DoUnRegisterInspector = this.DoUnRegisterInspector.bind(this);
    this.DoInstanceInspectorUpdate = this.DoInstanceInspectorUpdate.bind(this);
    this.DoModelUpdate = this.DoModelUpdate.bind(this);
    this.DoScriptUpdate = this.DoScriptUpdate.bind(this);
    this.DoSimReset = this.DoSimReset.bind(this);
    this.DoSimStart = this.DoSimStart.bind(this);
    this.DoSimStop = this.DoSimStop.bind(this);

    UR.SystemHook('SIM/UI_UPDATE', this.DoInstanceInspectorUpdate);
    UR.RegisterMessage('NET:INSPECTOR_REGISTER', this.DoRegisterInspector);
    UR.RegisterMessage('NET:INSPECTOR_UNREGISTER', this.DoUnRegisterInspector);
    UR.RegisterMessage('HACK_SIMDATA_UPDATE_MODEL', this.DoModelUpdate);
    UR.RegisterMessage('NET:HACK_SCRIPT_UPDATE', this.DoScriptUpdate);
    UR.RegisterMessage('NET:HACK_SIM_RESET', this.DoSimReset);
    UR.RegisterMessage('NET:HACK_SIM_START', this.DoSimStart);
    UR.RegisterMessage('NET:HACK_SIM_STOP', this.DoSimStop);
  }

  componentDidMount() {
    // initialize renderer
    const renderRoot = document.getElementById('root-renderer');
    RENDERER.SetGlobalConfig({ actable: true });
    RENDERER.Init(renderRoot);
    RENDERER.HookResize(window);
    this.DoSimReset();
  }

  componentWillUnmount() {
    UR.UnregisterMessage('NET:INSPECTOR_REGISTER', this.DoRegisterInspector);
    UR.UnregisterMessage('NET:INSPECTOR_UNREGISTER', this.DoUnRegisterInspector);
    UR.UnregisterMessage('HACK_SIMDATA_UPDATE_MODEL', this.DoModelUpdate);
    UR.UnregisterMessage('NET:HACK_SCRIPT_UPDATE', this.DoScriptUpdate);
    UR.UnregisterMessage('NET:HACK_SIM_RESET', this.DoSimReset);
    UR.UnregisterMessage('NET:HACK_SIM_START', this.DoSimStart);
    UR.UnregisterMessage('NET:HACK_SIM_STOP', this.DoSimStop);
  }

  /**
   * PanelSimulation keeps track of any instances that have been requested
   * for inspector monitoring.
   * We allow duplicate registrations so that when one device unregisters,
   * the instance is still considered monitored.
   * @param {Object} data { name: <string> } where name is the agent name.
   */
  DoRegisterInspector(data) {
    const name = data.name;
    MONITORED_INSTANCES.push(name);
  }
  DoUnRegisterInspector(data) {
    const name = data.name;
    const i = MONITORED_INSTANCES.indexOf(name);
    if (i > -1) MONITORED_INSTANCES.splice(i, 1);
  }

  /**
   * On every system loop, we broadcast instance updates
   * for any instances that have registered for modeling.
   * We keep this list small to keep from flooding the net with data.
   */
  DoInstanceInspectorUpdate() {
    // walk down agents and broadcast results
    const agents = GetAllAgents();
    const inspectorAgents = agents.map(a => {
      if (MONITORED_INSTANCES.includes(a.meta.name)) return a;
      // Return an instance spec so InstancePanel will show just tha name
      return {
        name: a.meta.name,
        id: a.id,
        blueprint: a.blueprint.name
      };
    });
    // Broadcast data
    UR.RaiseMessage('NET:INSPECTOR_UPDATE', { agents: inspectorAgents });
  }

  DoModelUpdate(data) {
    this.setState({ model: data.model });
  }

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
    const { model } = this.state;
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
      instancesSpec.push({ name: `${bp.name}01`, init: '' });
    }

    UR.RaiseMessage('AGENTS_PROGRAM', {
      blueprint: bp.name,
      instancesSpec
    });
  }

  DoSimStart() {
    SIM.Start();
  }

  DoSimStop() {
    SIM.End();
  }

  render() {
    const { title, model } = this.state;
    const { id, isActive, onClick, classes } = this.props;

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
