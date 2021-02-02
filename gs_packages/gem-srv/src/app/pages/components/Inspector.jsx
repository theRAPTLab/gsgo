/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React from 'react';
import UR from '@gemstep/ursys/client';
import { GetAgentByName } from 'modules/datacore';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

const SIZE_MIN = 'min'; // name only
const SIZE_MED = 'med'; // x and y (first line)
const SIZE_MAX = 'max'; // all

class Inspector extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'INSPECTOR',
      agent: {},
      data: undefined,
      size: SIZE_MED,
      color: '#009900',
      colorActive: '#33FF33',
      bgcolor: 'rgba(0,256,0,0.05)'
    };
    this.OnDataUpdate = this.OnDataUpdate.bind(this);
    this.OnInstanceClick = this.OnInstanceClick.bind(this);
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

  OnDataUpdate() {
    const { agent, size } = this.state;
    const data = [];
    // console.log('updating agent', agent);
    if (!agent || !agent.prop) return;
    if (size === SIZE_MIN) return;
    Object.keys(agent.prop).map(p => {
      // console.log('property', p, '=', agent.prop[p].value);
      if (size === SIZE_MED && !['x', 'y'].includes(p)) return;
      let val = agent.prop[p].value;
      switch (typeof val) {
        case 'number':
          val = agent.prop[p].value.toFixed(2);
          break;
        case 'string':
          val = agent.prop[p].value;
          break;
        default:
          return;
      }
      data.push({ label: p, value: val });
    });
    this.setState({ data });
  }

  /**
   * Clicking the instance name will toggle the Inspector object between
   * showing:
   * 1. SIZE_MIN = Name only
   * 2. SIZE_MED = Name + Position
   * 3. SIZE_MAX = All properties
   */
  OnInstanceClick() {
    // Toggle between different sizes to show/hide data
    const { size } = this.state;
    let newsize;
    switch (size) {
      case SIZE_MIN:
        newsize = SIZE_MED;
        break;
      case SIZE_MED:
        newsize = SIZE_MAX;
        break;
      default:
      case SIZE_MAX:
        newsize = SIZE_MIN;
        break;
    }
    this.setState({
      data: [], // clear data
      size: newsize
    });
  }

  render() {
    const { title, agent, data, size, color, colorActive, bgcolor } = this.state;
    const { id, agentName, isActive, classes } = this.props;
    return (
      <div
        style={{
          backgroundColor: '#000',
          margin: '0.5em 0 0.5em 0',
          cursor: 'pointer'
        }}
        onClick={this.OnInstanceClick}
      >
        <div>
          <div className={classes.inspectorData}>{agentName}</div>
        </div>
        <div
          style={{
            fontFamily: 'Andale Mono, monospace',
            fontSize: '10px',
            paddingLeft: '0.5em'
          }}
        >
          {data &&
            data.map(property => (
              <div
                style={{
                  display: 'inline-block',
                  paddingRight: '1em'
                }}
                key={property.label}
              >
                <div className={classes.inspectorLabel}>{property.label}:</div>
                <div className={classes.inspectorData}>{property.value}</div>
              </div>
            ))}
        </div>
      </div>
    );
  }
}

export default withStyles(useStylesHOC)(Inspector);
