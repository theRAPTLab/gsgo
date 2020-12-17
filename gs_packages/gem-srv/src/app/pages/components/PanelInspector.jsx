import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';

class PanelInspector extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'INSPECTOR',
      color: '#009900',
      colorActive: '#33FF33',
      bgcolor: 'rgba(0,256,0,0.05)'
    };
  }

  render() {
    const { title, color, colorActive, bgcolor } = this.state;
    const { id, isActive } = this.props;

    const onClick = () => {
      // To be implemented
      console.log('Show agent');
    };

    const styleLabel = {
      display: 'inline-block',
      color: '#006600',
      width: '80px',
      textAlign: 'right'
    };
    const styleData = {
      display: 'inline-block',
      color: isActive ? colorActive : color,
      width: '100px'
    };
    return (
      <PanelChrome id={id} title={title} isActive={isActive} onClick={onClick}>
        <div
          style={{
            color,
            backgroundColor: bgcolor,
            fontFamily: 'Andale Mono, monospace',
            fontSize: '10px',
            padding: '3px'
          }}
        >
          <div>
            <div style={styleLabel}>AGENT:</div>
            <div style={styleData}>FISH</div>
          </div>
          <div>
            <div style={styleLabel}>X:</div>
            <div style={styleData}>50</div>
          </div>
          <div>
            <div style={styleLabel}>Y:</div>
            <div style={styleData}>100</div>
          </div>
          <div>
            <div style={styleLabel}>EnergyLevel:</div>
            <div style={styleData}>25</div>
          </div>
          <div>
            <div style={styleLabel}>Status:</div>
            <div style={styleData}>Active</div>
          </div>
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelInspector);
