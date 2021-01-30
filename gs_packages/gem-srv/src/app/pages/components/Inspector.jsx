import React from 'react';
import UR from '@gemstep/ursys/client';
import { GetAgentByName } from 'modules/datacore';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

class Inspector extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'INSPECTOR',
      agent: {},
      data: {
        x: 0,
        y: 0,
        energyLevel: 0
      },
      color: '#009900',
      colorActive: '#33FF33',
      bgcolor: 'rgba(0,256,0,0.05)'
    };
    this.OnDataUpdate = this.OnDataUpdate.bind(this);
    UR.SystemHook('SIM/AGENTS_EXEC', this.OnDataUpdate);
  }

  componentDidMount() {
    const { agentName } = this.props;
    const agent = GetAgentByName(agentName);
    this.setState({ agent });
    // UR.RegisterMessage('NET:HACK_INSPECTOR_UPDATE', this.OnDataUpdate);
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
    const { agentName } = this.props;
    // console.log('update', update);
    // if (update.name !== agentName) return;
    // const { data } = this.state;
    // let newData = {};
    // newData.x = update.x.toFixed(2);
    // newData.y = update.y.toFixed(2);
    // newData.energyLevel = update.energyLevel;

    const { agent } = this.state;
    const data = {};
    console.log('updating agent', agent);
    data.x = agent.prop.x.value.toFixed(2);
    data.y = agent.prop.y.value.toFixed(2);
    this.setState({ data });
  }

  render() {
    const { title, data, color, colorActive, bgcolor } = this.state;
    const { id, isActive, classes } = this.props;
    return (
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
      </div>
    );
  }
}

export default withStyles(useStylesHOC)(Inspector);
