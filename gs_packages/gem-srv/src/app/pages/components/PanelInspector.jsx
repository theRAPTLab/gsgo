import React from 'react';
import UR from '@gemstep/ursys/client';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';

class PanelInspector extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'INSPECTOR',
      data: {
        name: '',
        x: 0,
        y: 0,
        energyLevel: 0
      },
      color: '#009900',
      colorActive: '#33FF33',
      bgcolor: 'rgba(0,256,0,0.05)'
    };
    this.OnDataUpdate = this.OnDataUpdate.bind(this);
    UR.RegisterMessage('NET:HACK_INSPECTOR_UPDATE', this.OnDataUpdate);
  }

  componentWillUnmount() {
    UR.UnregisterMessage('NET:HACK_INSPECTOR_UPDATE', this.OnDataUpdate);
  }

  /*
      HACK
      Grab the first agent sending an update.  Keep updating that same
      agent, ignore any additional updates.
      Updates are coming from sim-conditions.js's `touches` function.
  */
  OnDataUpdate(update) {
    // console.log('update', update);
    const { data } = this.state;
    let newData = {};
    if (data.name === '' || data.name === update.name) {
      newData.name = update.name;
      newData.x = update.x.toFixed(2);
      newData.y = update.y.toFixed(2);
      newData.energyLevel = update.energyLevel;
      this.setState({ data: newData });
    }
  }

  render() {
    const { title, data, color, colorActive, bgcolor } = this.state;
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
            <div className={classes.inspectorData}>{data.name}</div>
          </div>
          <div>
            <div className={classes.inspectorLabel}>X:</div>
            <div className={classes.inspectorData}>{data.x}</div>
          </div>
          <div>
            <div className={classes.inspectorLabel}>Y:</div>
            <div className={classes.inspectorData}>{data.y}</div>
          </div>
          <div>
            <div className={classes.inspectorLabel}>EnergyLevel:</div>
            <div className={classes.inspectorData}>{data.energyLevel}</div>
          </div>
          {/* <div>
            <div className={classes.inspectorLabel}>Status:</div>
            <div className={classes.inspectorData}>Active</div>
          </div> */}
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelInspector);
