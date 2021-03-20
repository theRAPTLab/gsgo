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


/// URSYS SYSHOOKS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HookPhase(
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
      title: 'Virtual Stage'
    };
    this.DoSimReset = this.DoSimReset.bind(this);
    this.DoSimPlaces = this.DoSimPlaces.bind(this);
    this.DoSimStart = this.DoSimStart.bind(this);
    this.DoSimStop = this.DoSimStop.bind(this);

    UR.HandleMessage('NET:HACK_SIM_RESET', this.DoSimReset);
    UR.HandleMessage('*:SIM_PLACES', this.DoSimPlaces);
    UR.HandleMessage('NET:HACK_SIM_START', this.DoSimStart);
    UR.HandleMessage('NET:HACK_SIM_STOP', this.DoSimStop);

  }

  componentDidMount() {
    // initialize renderer
    const renderRoot = document.getElementById('root-renderer');
    RENDERER.SetGlobalConfig({ actable: true });
    RENDERER.Init(renderRoot);
    RENDERER.HookResize(window);
  }

  componentWillUnmount() {
    UR.UnhandleMessage('NET:HACK_SIM_RESET', this.DoSimReset);
    UR.UnhandleMessage('*:SIM_PLACES', this.DoSimPlaces);
    UR.UnhandleMessage('NET:HACK_SIM_START', this.DoSimStart);
    UR.UnhandleMessage('NET:HACK_SIM_STOP', this.DoSimStop);
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
    // SimPlaces is called by Mission Control.
  }

  DoSimPlaces() {
    // 1. Load Model
    //    model data is loaded by the parent container MissionControl
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

    // 5. Update Inspectors
    UR.RaiseMessage('NET:REQUEST_INSPECTOR_UPDATE');
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
