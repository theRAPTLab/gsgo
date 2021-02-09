import React from 'react';
import UR from '@gemstep/ursys/client';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
import * as SIM from 'modules/sim/api-sim';
import * as GLOBAL from 'modules/datacore/dc-globals';
import * as DATACORE from 'modules/datacore';
import * as RENDERER from 'modules/render/api-render';
import * as TRANSPILER from 'script/transpiler';

import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('PanelSimulation');
const DBG = false;

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
    this.DoModelUpdate = this.DoModelUpdate.bind(this);
    this.DoScriptUpdate = this.DoScriptUpdate.bind(this);
    this.DoSimReset = this.DoSimReset.bind(this);
    this.DoSimStart = this.DoSimStart.bind(this);
    this.DoSimStop = this.DoSimStop.bind(this);

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
    UR.UnregisterMessage('HACK_SIMDATA_UPDATE_MODEL', this.DoModelUpdate);
    UR.UnregisterMessage('NET:HACK_SCRIPT_UPDATE', this.DoScriptUpdate);
    UR.UnregisterMessage('NET:HACK_SIM_RESET', this.DoSimReset);
    UR.UnregisterMessage('NET:HACK_SIM_START', this.DoSimStart);
    UR.UnregisterMessage('NET:HACK_SIM_STOP', this.DoSimStop);
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
