import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';

class PanelInspector extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'INSPECTOR (FAKE DATA)',
      color: '#009900',
      colorActive: '#33FF33',
      bgcolor: 'rgba(0,256,0,0.05)'
    };
  }

  render() {
    const { title, color, colorActive, bgcolor } = this.state;
    const { id, isActive, classes } = this.props;

    const onClick = () => {
      // To be implemented
      console.log('Show agent');
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
            <div className={classes.inspectorLabel}>AGENT:</div>
            <div className={classes.inspectorData}>FISH</div>
          </div>
          <div>
            <div className={classes.inspectorLabel}>X:</div>
            <div className={classes.inspectorData}>50</div>
          </div>
          <div>
            <div className={classes.inspectorLabel}>Y:</div>
            <div className={classes.inspectorData}>100</div>
          </div>
          <div>
            <div className={classes.inspectorLabel}>EnergyLevel:</div>
            <div className={classes.inspectorData}>25</div>
          </div>
          <div>
            <div className={classes.inspectorLabel}>Status:</div>
            <div className={classes.inspectorData}>Active</div>
          </div>
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelInspector);
