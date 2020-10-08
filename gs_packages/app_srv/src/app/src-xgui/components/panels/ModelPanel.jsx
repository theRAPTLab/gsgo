import React from 'react';
import UR from '@gemstep/ursys/client';
import * as RENDERER from 'modules/render/api-render';
import * as DATACORE from 'modules/runtime-datacore';

import APP from '../../app-logic';

const DBG = false;
const PR = UR.PrefixUtil('ModelPanel', 'Green');

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// hack in asset loader
let ASSETS_LOADED = false;
UR.SystemHook(
  'UR',
  'LOAD_ASSETS',
  () =>
    new Promise((resolve, reject) => {
      console.log(...PR('LOADING ASSET MANIFEST...'));
      (async () => {
        await DATACORE.ASSETS_LoadManifest('static/assets.json');
        ASSETS_LOADED = true;
        console.log(...PR('ASSETS LOADED'));
      })();
      resolve();
    })
);

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// need to fix "where to put persistent PixiJS panel"
UR.NetSubscribe('NET:DISPLAY_LIST', remoteList => {
  if (ASSETS_LOADED) {
    RENDERER.UpdateDisplayList(remoteList);
    RENDERER.Render();
  }
});

class ModelPanel extends React.Component {
  constructor() {
    super();

    this.state = {
      instances: [],
      selectedAgentId: undefined,
      selectedInstanceId: undefined,
      expanded: false
    };

    this.HandleDATAUpdate = this.HandleDATAUpdate.bind(this);
    this.HandleUIUpdate = this.HandleUIUpdate.bind(this);

    // REGISTER as a Listener
    APP.Subscribe(this);
  }

  componentDidMount() {
    const renderRoot = document.getElementById('root-renderer');
    RENDERER.Init(renderRoot);
    RENDERER.SetGlobalConfig({ actable: false });
    RENDERER.HookResize(window);
  }

  HandleDATAUpdate(data) {
    if (DBG) console.log(PR + 'Update data', data);
    this.setState({
      instances: data.INSTANCES
    });
  }

  HandleUIUpdate(data) {
    if (DBG) console.log(PR + 'Update ui', data);
    this.setState({
      selectedAgentId: data.selectedAgentId,
      selectedInstanceId: data.selectedInstanceId,
      selectedAgent: APP.GetAgent(data.selectedAgentId)
    });
  }

  componentWillUnmount() {
    APP.Unsubscribe(this);
  }

  render() {
    return (
      <div
        className="modelpanel"
        style={{
          flexGrow: 1,
          minWidth: '300px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignContent: 'center',
          overflow: 'scroll',
          height: '100%',
          width: '100%'
        }}
      >
        <div className="syslabel dark">MODEL</div>
        <div className="modelPane" style={{ flexGrow: 1 }}>
          <div className="modelSurface" id="root-renderer">
            renderer goes here
          </div>
        </div>
      </div>
    );
  }
}

export default ModelPanel;
