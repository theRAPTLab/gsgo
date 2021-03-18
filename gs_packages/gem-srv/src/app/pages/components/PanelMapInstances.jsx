/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Panel Map Instances

  Display the list of instances defined for a given map/model.
  You can edit the instance directly.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
import React from 'react';
import UR from '@gemstep/ursys/client';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';
import InstanceEditor from './InstanceEditor';

class PanelMapInstances extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Map Instances'
    };
  }

  render() {
    const { title } = this.state;
    const { id, isActive, mapInstanceSpec, classes } = this.props;

    if (!mapInstanceSpec) return <></>;

    // Group instances by blueprint
    const instancesByType = {};
    mapInstanceSpec.forEach(i => {
      if (instancesByType[i.blueprint.name] === undefined)
        instancesByType[i.blueprint.name] = [];
      instancesByType[i.blueprint.name].push(i);
    });
    const instancesByBlueprint = Object.keys(instancesByType).map(key => {
      return {
        name: key,
        instances: [...instancesByType[key]]
      };
    });

    const onPanelChromeClick = () => {
      // To be implemented
      console.log('Clicked PanelMapInstances');
    };

    return (
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
            {instancesByBlueprint.map(blueprint => (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap'
                }}
                key={blueprint.name}
              >
                {blueprint.instances.map(i => (
                  <InstanceEditor instance={i} key={i.id} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelMapInstances);
