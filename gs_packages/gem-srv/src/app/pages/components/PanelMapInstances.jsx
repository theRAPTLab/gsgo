/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Panel Map Instances

  Display the list of instances defined for a given map/model.
  You can edit the instance directly.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
import React from 'react';
import UR from '@gemstep/ursys/client';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../helpers/page-xui-styles';

import PanelChrome from './PanelChrome';
import InstanceEditor from './InstanceEditor';

class PanelMapInstances extends React.Component {
  constructor() {
    super();
    const { instanceidList } = UR.ReadFlatStateGroups('instances');
    this.state = {
      title: 'Characters',
      instanceidList
    };
    this.urStateUpdated = this.urStateUpdated.bind(this);
  }

  componentDidMount() {
    UR.SubscribeState('instances', this.urStateUpdated);
  }

  componentWillUnmount() {
    UR.UnsubscribeState('instances', this.urStateUpdated);
  }

  urStateUpdated(stateObj, cb) {
    const { instanceidList } = stateObj;

    if (!instanceidList) return;

    // do we really want to update the instance every time?
    if (!instanceidList)
      throw new Error(
        `InstanceEditor instanceidList ${instanceidList} not found!`
      );
    this.setState({ instanceidList });

    if (typeof cb === 'function') cb();
  }

  render() {
    const { title, instanceidList } = this.state;
    const { id, isActive, classes } = this.props;

    // sort alphabetically
    const sortedInstances = instanceidList.sort((a, b) => {
      if (a.label < b.label) return -1;
      if (a.label > b.label) return 1;
      return 0;
    });

    // DEPRECATED
    // Group instances by blueprint
    // const instancesByType = {};
    // mapInstanceSpec.forEach(i => {
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
            fontSize: '12px',
            overflow: 'hidden'
          }}
        >
          <span className={classes.instructions}>click to edit character</span>
          <div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap'
              }}
            >
              {sortedInstances.map(i => (
                <InstanceEditor id={i.id} label={i.label} key={i.id} />
              ))}
            </div>
            {/* DEPRECATED: Instances by Blueprint
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
                  <InstanceEditor modelId={modelId} instance={i} key={i.id} />
                ))}
              </div>
            ))} */}
          </div>
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelMapInstances);
