import React from 'react';
import * as DATACORE from 'modules/datacore';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';

class PanelBlueprints extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Sim Blueprints (Fake Data)'
    };
  }

  render() {
    const { title } = this.state;
    const { id, isActive, agents, classes } = this.props;

    const onClick = () => {
      // To be implemented
      console.log('Show instance');
    };

    return (
      // Placeholder for now
      <PanelChrome id={id} title={title} isActive={isActive} onClick={onClick}>
        <div // Panel Layout
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: '12px'
          }}
        >
          <span className={classes.instructions}>Click to Show/Hide</span>
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
                  key={a.label}
                >
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
