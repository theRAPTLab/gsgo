import React from 'react';
import UR from '@gemstep/ursys/client';
import 'modules/datacore/dc-project'; // Have to import to load db
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as ACProjects from 'modules/appcore/ac-projects'; // Have to import to access state

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
    const { projectNames } = UR.ReadFlatStateGroups('projects');
    this.state = {
      title: 'Select Project',
      projectNames: projectNames
      // projectNames: [
      //   // Dummy Data
      //   { id: 'aquatic', label: 'Aquatic Ecosystems' },
      //   { id: 'decomposition', label: 'Decomposition' },
      //   { id: 'particles', label: 'Particles' },
      //   { id: 'aquatic-blue', label: 'Blue Group Aquatic' }
      // ]
    };
    this.onClick = this.onClick.bind(this);
    this.urStateUpdated = this.urStateUpdated.bind(this);
  }

  componentDidMount() {
    UR.SubscribeState('projects', this.urStateUpdated);
  }

  componentWillUnmount() {
    UR.UnsubscribeState('projects', this.urStateUpdated);
  }

  onClick(modelId) {
    if (DBG) console.log(...PR('Clicked to Select model ID:', modelId));
    // This should request a model load through URSYS
    // HACK for now to go to main select screen
    const { onClick } = this.props;
    onClick(modelId); // Tell Login panel to show Panelselect
  }

  urStateUpdated(stateObj, cb) {
    const { projectNames } = stateObj;
    if (projectNames) {
      this.setState({ projectNames });
    }
    if (typeof cb === 'function') cb();
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
