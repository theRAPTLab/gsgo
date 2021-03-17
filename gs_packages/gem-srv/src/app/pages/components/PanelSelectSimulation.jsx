import React from 'react';
import UR from '@gemstep/ursys/client';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

// HACK DATA LOADING
import SimData from '../../data/sim-data';

import PanelChrome from './PanelChrome';

class PanelSelectSimulation extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Select Simulation',
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
    this.OnModelsUpdate = this.OnModelsUpdate.bind(this);

    UR.HandleMessage('NET:UPDATE_MODELS', this.OnModelsUpdate);
  }

  componentDidMount() {
    UR.RaiseMessage('*:REQUEST_MODELS');
  }

  componentWillUnmount() {
    UR.UnhandleMessage('NET:UPDATE_MODELS', this.OnModelsUpdate);
  }

  onClick(modelId) {
    console.log('Select model ID:', modelId);
    // This should request a model load through URSYS
    // HACK for now to go to main select screen
    const { onClick } = this.props;
    onClick(modelId); // Tell Login panel to show Panelselect
  }

  OnModelsUpdate(data) {
    this.setState({ models: data.models });
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
              <p>Select a simulation to work on:</p>
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
