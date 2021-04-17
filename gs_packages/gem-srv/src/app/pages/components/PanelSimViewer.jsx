import React from 'react';

// SELECT RUNTIME MODULES FOR APP
import * as RENDERER from 'modules/render/api-render';
import * as GLOBAL from 'modules/datacore/dc-globals';
//
import UR from '@gemstep/ursys/client';

import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('PanelSimViewer');
const FCON = UR.HTMLConsoleUtil('console-bottom');
const DBG = true;
let ASSETS_LOADED = false;

UR.HookPhase('UR/LOAD_ASSETS', () => {
  return new Promise((resolve, reject) => {
    if (DBG) console.log(...PR('LOADING ASSET MANIFEST @ UR/LOAD_ASSETS...'));
    (async () => {
      let map = await GLOBAL.LoadAssetsSync('static/assets.json');
      if (DBG) console.log(...PR('ASSETS LOADED'));
      console.log(...PR('Waiting for user input'));
      ASSETS_LOADED = true;
      resolve();
    })();
  });
});

/// DISPLAY LIST TESTS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let updateCount = 0;
UR.HandleMessage('NET:DISPLAY_LIST', remoteList => {
  if (ASSETS_LOADED) {
    FCON.plot(
      `${updateCount++} NET:DISPLAY_LIST received ${
        remoteList.length
      } DOBJs by TRACKER`,
      0
    );
    RENDERER.UpdateDisplayList(remoteList);
    RENDERER.Render();
  }
});

/// MESSAGER TEST HANDLER /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HandleMessage('NET:HELLO', data => {
  console.log('NET:HELLO processing', data);
  return { str: 'tracker got you' };
});

class PanelSimViewer extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Virtual Stage (view-only)',
      color: '#33FF33',
      bgcolor: 'rgba(0,256,0,0.1)'
    };
  }

  componentDidMount() {
    const renderRoot = document.getElementById('root-renderer');
    RENDERER.SetGlobalConfig({ actable: false });
    RENDERER.Init(renderRoot);
    RENDERER.HookResize(window);
  }

  componentWillUnmount() {
    console.log('componentWillUnmount');
  }

  render() {
    const { title, bgcolor, color } = this.state;
    const { id, onClick, classes } = this.props;
    return (
      <PanelChrome
        id={id} // used by click handler to identify panel
        title={title}
        color={color}
        bgcolor={bgcolor}
        onClick={onClick}
      >
        <div id="root-renderer" style={{ color: bgcolor, height: '100%' }}>
          Ho this is the sim!
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelSimViewer);
