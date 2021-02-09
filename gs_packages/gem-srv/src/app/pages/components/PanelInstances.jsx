import React from 'react';
import UR from '@gemstep/ursys/client';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';
import InstanceInspector from './InstanceInspector';

class PanelInstances extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Instances'
    };
  }

  render() {
    const { title } = this.state;
    const { id, isActive, instances, classes } = this.props;

    const typedInstances = {};
    instances.forEach(i => {
      if (typedInstances[i.blueprint] === undefined) {
        typedInstances[i.blueprint] = [i];
      } else {
        typedInstances[i.blueprint].push(i);
      }
    });
    const instanceArray = Object.keys(typedInstances).map(key => {
      return {
        agent: key,
        instances: [...typedInstances[key]]
      };
    });

    const onPanelChromeClick = () => {
      // To be implemented
      console.log('Show instance');
    };

    return (
      // Placeholder for now
      <PanelChrome
        id={id}
        title={title}
        isActive={isActive}
        onClick={onPanelChromeClick}
      >
        <div // Panel Layout
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: '12px'
          }}
        >
          <span className={classes.instructions}>click to show/hide data</span>
          <div>
            {instanceArray.map(a => (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap'
                }}
                key={a.agent}
              >
                {a.instances.map(i => (
                  <InstanceInspector agentName={i.name} key={i.name} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelInstances);
