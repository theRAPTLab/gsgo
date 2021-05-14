import React from 'react';
import UR from '@gemstep/ursys/client';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';

class PanelSelectSimulation extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Select Project',
      models: []
      // models: [
      //   // Dummy Data
      //   { id: 'aquatic', label: 'Aquatic Ecosystems' },
      //   { id: 'decomposition', label: 'Decomposition' },
      //   { id: 'particles', label: 'Particles' },
      //   { id: 'aquatic-blue', label: 'Blue Group Aquatic' }
      // ]
    };
    this.onClick = this.onClick.bind(this);
  }

  componentDidMount() {
    const fnName = 'ReadProjectsList';
    UR.CallMessage('NET:REQ_PROJDATA', { fnName }).then(rdata =>
      this.setState({ models: rdata.result })
    );
  }

  onClick(modelId) {
    console.log('Select model ID:', modelId);
    // This should request a model load through URSYS
    // HACK for now to go to main select screen
    const { onClick } = this.props;
    onClick(modelId); // Tell Login panel to show Panelselect
  }

  render() {
    const { title, models } = this.state;
    const { id, isActive, onClick, classes } = this.props;

    return (
      <PanelChrome id={id} title={title} isActive={isActive} onClick={onClick}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              width: '200px',
              padding: '30px'
            }}
          >
            <div className={classes.instructions}>
              <p>Select a project to work on:</p>
            </div>
            {models.map(m => (
              <button
                type="button"
                className={classes.button}
                key={m.id}
                onClick={() => this.onClick(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelSelectSimulation);
