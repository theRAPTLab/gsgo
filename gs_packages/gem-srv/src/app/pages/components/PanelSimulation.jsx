import React from 'react';
import UR from '@gemstep/ursys/client';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
import * as ASSETS from 'modules/asset_core';
import * as RENDERER from 'modules/render/api-render';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../helpers/page-xui-styles';
import { GS_ASSETS_PROJECT_ROOT } from '../../../../config/gem-settings';

import PanelChrome from './PanelChrome';
import WebCam from './WebCam';

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
      title: 'Virtual Stage',
      psWidth: 512,
      psHeight: 512,
      psScale: { x: 1, y: 1 }
    };
    this.setBoundary = this.setBoundary.bind(this);
    this.updateSize = this.updateSize.bind(this);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  componentDidMount() {
    // initialize renderer
    const renderRoot = document.getElementById('root-renderer');
    RENDERER.SetGlobalConfig({ actable: true });
    RENDERER.Init(renderRoot);
    RENDERER.HookResize(window, this.updateSize);
    window.addEventListener('resize', this.setBoundary);

    UR.HandleMessage('BOUNDARY_UPDATE', this.updateSize);

    this.updateSize();
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  componentWillUnmount() {}

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Re-center the sim renderer AND the webcam when the window resizes
  setBoundary(e) {
    const { width, height, bgcolor } = this.props;
    RENDERER.SetBoundary(width, height, bgcolor);
    this.updateSize();
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Update pixi app screen size if
  /// a. The window has been resized, or
  /// b. The boundaries (world size) have been set by the project settings
  updateSize() {
    const psSize = RENDERER.GetPixiAppScreenSize();
    const psScale = RENDERER.GetPixiRootScale();
    this.setState({ psWidth: psSize.width, psHeight: psSize.height, psScale });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  render() {
    const { title, psWidth, psHeight, psScale } = this.state;
    const { id, bgcolor, isActive, onClick, classes } = this.props;
    let { width, height } = this.props;
    if (!width || !height) {
      width = 512;
      height = 512;
    }
    const vwidth = width * psScale.x;
    const vheight = height * psScale.y;

    return (
      <PanelChrome id={id} title={title} isActive={isActive} onClick={onClick}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}
        >
          <div
            id="root-renderer"
            style={{
              height: '100%',
              width: '100%',
              zIndex: 2, // video is at 0
              backgroundColor: 'transparent'
            }}
          >
            Waiting for start...
          </div>
          <WebCam width={vwidth} height={vheight} />
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelSimulation);
