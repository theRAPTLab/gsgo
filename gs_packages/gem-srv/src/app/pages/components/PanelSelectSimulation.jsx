import React from 'react';
import UR from '@gemstep/ursys/client';
import { GetProjectNames } from 'modules/datacore/dc-project';

import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('PanelSelectSimulation', 'TagPurple');
const DBG = true;

// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class PanelSelectSimulation extends React.Component {
  constructor() {
    super();
    // const state = UR.ReadFlatStateGroups('projects');
    this.state = {
      title: 'Select Project',
      projectNames: []
      // projectNames: [
      //   // Dummy Data
      //   { id: 'aquatic', label: 'Aquatic Ecosystems' },
      //   { id: 'decomposition', label: 'Decomposition' },
      //   { id: 'particles', label: 'Particles' },
      //   { id: 'aquatic-blue', label: 'Blue Group Aquatic' }
      // ]
    };
    this.onClick = this.onClick.bind(this);
    this.loadProjectNames = this.loadProjectNames.bind(this);
  }

  componentDidMount() {
    this.loadProjectNames();
  }

  componentWillUnmount() {}

  onClick(modelId) {
    console.log('Select model ID:', modelId);
    // This should request a model load through URSYS
    // HACK for now to go to main select screen
    const { onClick } = this.props;
    onClick(modelId); // Tell Login panel to show Panelselect
  }

  async loadProjectNames() {
    const projectNames = await GetProjectNames();
    console.log('projectNames', projectNames);
    this.setState({ projectNames });
  }

  render() {
    const { title, projectNames } = this.state;
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
            {projectNames.map(m => (
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
