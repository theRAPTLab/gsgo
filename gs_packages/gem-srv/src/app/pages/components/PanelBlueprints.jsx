/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Lists all the blueprints available in a model
  * Used in MissionControl to see which blueprints have been defined
    (click to open the script)
  * Used with MapEditor to create new instances
    (click to create new instance)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
import React from 'react';
import UR from '@gemstep/ursys/client';
import * as DATACORE from 'modules/datacore';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';

class PanelBlueprints extends React.Component {
  constructor() {
    super();
    this.state = {
      title: ''
    };
    this.OnBlueprintClick = this.OnBlueprintClick.bind(this);
  }

  componentDidMount() {
    const { enableAdd } = this.props;
    const title = enableAdd ? 'Add Characters' : 'Character Type Scripts';
    this.setState({ title });
  }

  OnBlueprintClick(scriptId) {
    const { modelId, enableAdd } = this.props;
    if (enableAdd) {
      // Add Instance
      UR.RaiseMessage('LOCAL:INSTANCE_ADD', { modelId, blueprintName: scriptId });
    } else {
      // Open script in a new window
      window.open(
        `/app/scripteditor?model=${modelId}&script=${scriptId}`,
        '_blank'
      );
    }
  }

  render() {
    const { title } = this.state;
    const { modelId, id, isActive, agents, enableAdd, classes } = this.props;
    const instructions = enableAdd ? 'Click to add a character' : '';
    const onPanelClick = () => {
      // To be implemented
      console.log('Show instance');
    };
    return (
      // Placeholder for now
      <PanelChrome
        id={id}
        title={title}
        isActive={isActive}
        onClick={onPanelClick}
      >
        <div // Panel Layout
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: '12px'
          }}
        >
          <span className={classes.instructions}>{instructions}</span>
          <div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap'
              }}
            >
              {agents.map(a => (
                <div
                  style={{
                    flex: '0 1 auto',
                    height: '20px'
                  }}
                  className={classes.instanceListItem}
                  onClick={() => this.OnBlueprintClick(a.id)}
                  key={a.label}
                >
                  {enableAdd ? (
                    <AddIcon style={{ fontSize: 10, marginRight: '0.3em' }} />
                  ) : (
                    <EditIcon style={{ fontSize: 10, marginRight: '0.3em' }} />
                  )}
                  {a.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelBlueprints);
