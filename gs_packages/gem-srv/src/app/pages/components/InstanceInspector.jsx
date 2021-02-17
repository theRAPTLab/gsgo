/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React from 'react';
import UR from '@gemstep/ursys/client';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

const SIZE_MIN = 'min'; // name only
const SIZE_MAX = 'max'; // all

/**
 * InstanceInspector can display two types of data.
 *  * GAgent -- e.g. blueprint name is instance.meta.name
 *  * Instance Spec -- e.g. blueprint name is instance.name
 *
 * We support both because
 * a) before the simulation is run, we only have the instance spec
 * b) GAgents are only available after the simulation is running
 * This way the list of instances always shows at least the name.
 *
 */
class InstanceInspector extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'INSPECTOR',
      size: SIZE_MIN,
      alreadyRegistered: false,
      color: '#009900',
      colorActive: '#33FF33',
      bgcolor: 'rgba(0,256,0,0.05)'
    };
    this.GetInstanceName = this.GetInstanceName.bind(this);
    this.GetInstanceProperties = this.GetInstanceProperties.bind(this);
    this.OnInstanceClick = this.OnInstanceClick.bind(this);
  }

  componentDidMount() {
    const { instance } = this.props;
    // If the instance has prop data, then it has been registered
    // and should automatically be set to SIZE_MAX
    if (instance && instance.prop) {
      this.setState({
        size: SIZE_MAX,
        alreadyRegistered: true
      });
    }
  }

  componentWillUnmount() {
    // Don't unregister here because changing size can cause unmount?
    // so the agent ends up unregistered when really it should stay registered
  }

  GetInstanceName() {
    // Is `instance` a `GAgent` or an `instanceSpec`
    // -- if instance.meta then instance is a GAgent, so get name via instance.meta.name
    // -- else instance is an instanceDef so get name via instance.name
    const { instance } = this.props;
    if (!instance) return '';
    return instance.meta ? instance.meta.name : instance.name;
  }

  /**
   * Walks down the instance properties array instance.prop
   * and generates a spec data for rendering the 'label': 'value'
   * Called by render()
   */
  GetInstanceProperties() {
    const { size } = this.state;
    const { instance } = this.props;
    const data = [];
    if (size === SIZE_MIN) return data; // Don't show any properties if minimized
    if (instance && instance.prop) {
      Object.keys(instance.prop).map(p => {
        // REVIEW: Why does `._value` work, but not `.value`?
        let val = instance.prop[p]._value;
        switch (typeof val) {
          case 'number':
            val = instance.prop[p]._value.toFixed(2);
            break;
          case 'string':
            val = instance.prop[p]._value;
            break;
          default:
            return;
        }
        data.push({ label: p, value: val });
      });
    }
    // show id too -- useful for debugging
    // data.push({ label: 'id', value: instance.id });
    return data;
  }

  /**
   * Clicking the instance name will toggle the Inspector object between
   * showing:
   * 1. SIZE_MIN = Name only
   * 3. SIZE_MAX = All properties
   */
  OnInstanceClick() {
    // Toggle between different sizes to show/hide data
    const { size, alreadyRegistered } = this.state;
    const { disallowDeRegister } = this.props;
    const name = this.GetInstanceName();
    let registrationStatus = alreadyRegistered;
    let newsize;
    switch (size) {
      case SIZE_MIN:
        newsize = SIZE_MAX;
        if (!alreadyRegistered) {
          UR.RaiseMessage('NET:INSPECTOR_REGISTER', { name });
          registrationStatus = true;
        }
        break;
      default:
      case SIZE_MAX:
        newsize = SIZE_MIN;
        if (alreadyRegistered && !disallowDeRegister) {
          UR.RaiseMessage('NET:INSPECTOR_UNREGISTER', { name });
        }
        break;
    }
    this.setState({ size: newsize, alreadyRegistered: registrationStatus });
  }

  render() {
    const { title, size, color, colorActive, bgcolor } = this.state;
    const { id, instance, isActive, disallowDeRegister, classes } = this.props;
    const agentName = this.GetInstanceName();
    const data = this.GetInstanceProperties();
    return (
      <div
        style={{
          backgroundColor: '#000',
          margin: '0.5em 0 0.5em 0.5em',
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

export default withStyles(useStylesHOC)(InstanceInspector);
