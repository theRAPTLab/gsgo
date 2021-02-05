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
        console.log(...PR('Waiting for user input'));
        // SIM.Start();
        // if (DBG) console.log(...PR('SIMULATION STARTED'));
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
    this.DoScriptUpdate = this.DoScriptUpdate.bind(this);
    this.DoSimReset = this.DoSimReset.bind(this);
    this.DoSimStart = this.DoSimStart.bind(this);

    UR.RegisterMessage('NET:HACK_SCRIPT_UPDATE', this.DoScriptUpdate);
    UR.RegisterMessage('NET:HACK_SIM_RESET', this.DoSimReset);
    UR.RegisterMessage('NET:HACK_SIM_START', this.DoSimStart);
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
    UR.UnregisterMessage('NET:HACK_SCRIPT_UPDATE', this.DoScriptUpdate);
    UR.UnregisterMessage('NET:HACK_SIM_RESET', this.DoSimReset);
    UR.UnregisterMessage('NET:HACK_SIM_START', this.DoSimStart);
  }

  DoSimReset() {
    console.log('sim reset');
    DATACORE.DeleteAllTests();
    // DATACORE.DeleteAllGlobalConditions(); // removed in script-xp branch
    DATACORE.DeleteAllScriptEvents();
    DATACORE.DeleteAllAgents();
    DATACORE.DeleteAllInstances();
  }

  DoScriptUpdate(data) {
    console.log('script update');
    DATACORE.DeleteAllInstances(); // Delete all instances otherwise previously created instances will stick around
    const source = TRANSPILER.ScriptifyText(data.script);
    const bundle = TRANSPILER.CompileBlueprint(source);
    const bp = TRANSPILER.RegisterBlueprint(bundle);
    UR.RaiseMessage('AGENT_PROGRAM', bp.name);
  }

  DoSimStart() {
    console.log('sim start');
    SIM.Start();
  }

  render() {
    const { title } = this.state;
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
