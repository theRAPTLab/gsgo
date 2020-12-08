import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../page-xui-styles';

import PanelChrome from './PanelChrome';

class PanelPlayback extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Sim Control'
    };
  }

  render() {
    const { title } = this.state;
    const { id, isActive, classes } = this.props;

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
            <div className={classes.button}>START</div>
            <div className={classes.button}>PAUSE</div>
            <div className={classes.button}>STOP</div>
            <div className={classes.button}>REPLAY</div>
          </div>
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelPlayback);
