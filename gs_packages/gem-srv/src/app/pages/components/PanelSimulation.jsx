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
import PROJ from '../../data/project-data';

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
  }

  componentDidMount() {
    // initialize renderer
    const renderRoot = document.getElementById('root-renderer');
    RENDERER.SetGlobalConfig({ actable: true });
    RENDERER.Init(renderRoot);
    RENDERER.HookResize(window);
  }

  componentWillUnmount() {}

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
