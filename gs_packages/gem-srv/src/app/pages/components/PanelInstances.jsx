import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../page-xui-styles';

import PanelChrome from './PanelChrome';

class PanelInstances extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Sim Instances'
    };
  }

  render() {
    const { title } = this.state;
    const { id, isActive, classes } = this.props;

    const allInstances = [
      {
        agent: 'Fish',
        instances: [
          { label: 'Fish01' },
          { label: 'Fish02', hidden: true },
          { label: 'Fish03' }
        ]
      },
      {
        agent: 'Algae',
        instances: [
          { label: 'Algae01' },
          { label: 'Algae02' },
          { label: 'Algae03' },
          { label: 'Algae04' },
          { label: 'Algae05' },
          { label: 'Algae06', hidden: true },
          { label: 'Algae07', hidden: true },
          { label: 'Algae08' },
          { label: 'Algae09', hidden: true },
          { label: 'Algae10' }
        ]
      },
      {
        agent: 'LightBeam',
        instances: [{ label: 'LightBeam01' }]
      }
    ];

    const onClick = () => {
      // To be implemented
      console.log('Show instance');
    };

    return (
      <PanelChrome id={id} title={title} isActive={isActive} onClick={onClick}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexWrap: 'wrap',
            fontSize: '12px'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {allInstances.map(a => (
              <div
                className={classes.infoLabelColor}
                style={{ padding: '5px' }}
                key={a.agent}
              >
                {a.agent}
                {a.instances.map(i => (
                  <div
                    className={
                      i.hidden
                        ? `${classes.instanceListItem} ${classes.instanceListItemInactive}`
                        : classes.instanceListItem
                    }
                    key={`${a.agent}_${i.label}`}
                  >
                    {i.label}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <span className={classes.instructions}>Click to Show/Hide</span>
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelInstances);
