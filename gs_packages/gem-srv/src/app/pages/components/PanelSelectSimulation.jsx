import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';

class PanelSelectSimulation extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Select Simulation',
      models: [
        // Dummy Data
        { id: 'HASH1', label: 'Aquatic Ecosystems' },
        { id: 'HASH2', label: 'Decomposition' },
        { id: 'HASH3', label: 'Particles' },
        { id: 'HASH4', label: 'Blue Group Aquatic' }
      ]
    };
    this.onClick = this.onClick.bind(this);
  }

  onClick(modelId) {
    console.log('Select model ID:', modelId);
    // This should request a model load through URSYS
    // HACK for now to go to main select screen
    const { onClick } = this.props;
    onClick('select');
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
              <p>
                Select a simulation to work on: (FAKE DATA -- Click any button to
                select the one generic model we current support)
              </p>
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
