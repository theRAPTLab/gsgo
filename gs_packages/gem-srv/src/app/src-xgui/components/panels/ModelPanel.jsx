import React from 'react';
import UR from '@gemstep/ursys/client';
import * as RENDERER from 'modules/render/api-render';
import * as DATACORE from 'modules/datacore';

import APP from '../../app-logic';

const DBG = false;
const PR = UR.PrefixUtil('ModelPanel', 'Green');

// /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// // need to fix "where to put persistent PixiJS panel"
// UR.RegisterMessage('NET:DISPLAY_LIST', remoteList => {
//   if (ASSETS_LOADED) {
//     RENDERER.UpdateDisplayList(remoteList);
//     RENDERER.Render();
//   }
// });

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

  componentDidMount() {}

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
    return <div id="root-renderer">renderer goes here</div>;
  }
}

export default ModelPanel;
