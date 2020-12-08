import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../page-xui-styles';

import PanelChrome from './PanelChrome';

class PanelSim extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'SIM',
      color: '#33FF33',
      bgcolor: 'rgba(0,256,0,0.1)'
    };
  }

  render() {
    const { title, bgcolor, color } = this.state;
    const { id, onClick } = this.props;
    return (
      <PanelChrome
        id={id} // used by click handler to identify panel
        title={title}
        color={color}
        bgcolor={bgcolor}
        onClick={onClick}
      >
        <div style={{ color: bgcolor, height: '500px' }}>Ho this is the sim!</div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelSim);
