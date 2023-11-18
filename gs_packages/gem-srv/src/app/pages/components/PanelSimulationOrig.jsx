import React from 'react';
import UR from '@gemstep/ursys/client';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
import * as ASSETS from 'modules/asset_core';
import * as RENDERER from 'modules/render/api-render';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../helpers/page-xui-styles';
import { GS_ASSETS_PROJECT_ROOT } from '../../../../config/gem-settings';

import PanelChrome from './PanelChrome';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('PanelSimulation');
const DBG = false;

/// URSYS SYSHOOKS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/* @BEN are you inadvertently loading assets twice? The asset load should
   have been handled by the asset manager automatically */
UR.HookPhase(
  'UR/LOAD_ASSETS',
  () =>
    new Promise((resolve, reject) => {
      if (DBG) console.log(...PR('LOADING ASSET MANIFEST @ UR/LOAD_ASSETS...'));
      void (async () => {
        if (DBG) console.log(...PR('ASSETS LOADED'));
        await ASSETS.PromiseLoadAssets(GS_ASSETS_PROJECT_ROOT);
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
    this.setBoundary = this.setBoundary.bind(this);
  }

  componentDidMount() {
    // initialize renderer
    const renderRoot = document.getElementById('root-renderer');
    RENDERER.SetGlobalConfig({ actable: true });
    RENDERER.Init(renderRoot);
    RENDERER.HookResize(window);
    window.addEventListener('resize', this.setBoundary);
  }

  componentWillUnmount() {}

  setBoundary() {
    const { width, height, bgcolor } = this.props;
    RENDERER.SetBoundary(width, height, bgcolor);
  }

  render() {
    const { title } = this.state;
    const { id, width, height, bgcolor, isActive, onClick, classes } = this.props;

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
