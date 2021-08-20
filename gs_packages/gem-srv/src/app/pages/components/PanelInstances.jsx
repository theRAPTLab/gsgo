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
      title: 'Characters'
    };
  }

  render() {
    const { title } = this.state;
    const { id, isActive, instances, disallowDeRegister, classes } = this.props;

    if (!instances) return <></>;

    // sort alphabetically
    const sortedInstances = instances.sort((a, b) => {
      const aname = a.meta ? a.meta.name : a.name;
      const bname = b.meta ? b.meta.name : b.name;
      if (aname < bname) return -1;
      if (aname > bname) return 1;
      return 0;
    });

    // DEPRECATED
    // Group instances by blueprint
    // const instancesByType = {};
    // instances.forEach(i => {
    //   if (instancesByType[i.blueprint.name] === undefined)
    //     instancesByType[i.blueprint.name] = [];
    //   instancesByType[i.blueprint.name].push(i);
    // });
    // const instancesByBlueprint = Object.keys(instancesByType).map(key => {
    //   return {
    //     name: key,
    //     instances: [...instancesByType[key]]
    //   };
    // });

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
            fontSize: '12px',
            overflow: 'hidden'
          }}
        >
          <span className={classes.instructions}>click to show/hide data</span>
          <div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flexWrap: 'wrap'
              }}
            >
              {sortedInstances.map(i => (
                <InstanceInspector
                  instance={i}
                  key={i.id}
                  disallowDeRegister={disallowDeRegister}
                />
              ))}
            </div>
            {/* DEPRECATED: Sort by blueprint
            {instancesByBlueprint.map(blueprint => (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flexWrap: 'wrap'
                }}
                key={blueprint.name}
              >
                {blueprint.instances.map(i => (
                  <InstanceInspector
                    instance={i}
                    key={i.id}
                    disallowDeRegister={disallowDeRegister}
                  />
                ))}
              </div>
            ))} */}
          </div>
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelInstances);
