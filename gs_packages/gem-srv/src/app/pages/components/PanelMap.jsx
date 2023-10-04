import React from 'react';
import UR from '@gemstep/ursys/client';
import * as ACBlueprints from 'modules/appcore/ac-blueprints';
import * as ACInstances from 'modules/appcore/ac-instances';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../helpers/page-xui-styles';

import PanelChrome from './PanelChrome';

function FriendlifyName(deviceName) {
  let name;
  // Strip out 'UADDR_'
  name = String(deviceName).substring(6);
  // Add "CC" to match input names
  name = `CC${name}`;
  return name;
}

class PanelMap extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'CHARACTER CONTROLLERS',
      simulationName: 'Aquatic Ecosystems',
      bpNamesList: [],
      tags: []
    };
    this.urBlueprintsStateUpdated = this.urBlueprintsStateUpdated.bind(this);
    this.urInstancesStateUpdated = this.urInstancesStateUpdated.bind(this);
    this.HandleTagSelect = this.HandleTagSelect.bind(this);
  }

  componentDidMount() {
    UR.SubscribeState('blueprints', this.urBlueprintsStateUpdated);
    UR.SubscribeState('instances', this.urInstancesStateUpdated);
  }

  urBlueprintsStateUpdated(stateObj, cb) {
    const { nonGlobalBpNamesList } = stateObj;
    if (nonGlobalBpNamesList) {
      // 'global' should not be selectable as a bp on PanelMaps
      this.setState({ bpNamesList: nonGlobalBpNamesList });
    }
    if (typeof cb === 'function') cb();
  }

  // `instances` state includes:
  // * instance group `instances` are map-defined instances (via Main SETUP)
  // * intance group `tags` are dynamically generated instances like charcontrol and pozyx
  urInstancesStateUpdated(stateObj, cb) {
    const { instances, tags } = stateObj;
    if (tags) {
      // assign instances to default bp by default
      const defaultBpName = ACBlueprints.GetDefaultInputBpName();
      const defaultTags = tags.map(t => {
        t.bpid = defaultBpName;
        return t;
      });
      this.setState({ tags: defaultTags });
    }
    if (typeof cb === 'function') cb();
  }

  // User has selected a new blueprint to map to the selected input tag
  // Create a new instance with the selected blueprint
  HandleTagSelect(event, inputID) {
    const bpName = event.target.value;
    ACInstances.UpdateTag(inputID, bpName);
  }

  render() {
    const { title, simulationName, bpNamesList, tags } = this.state;
    const { id, devices, isMinimized, onClick, classes } = this.props;
    if (!bpNamesList) return ''; // not loaded yet

    // STYLES - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const styleDeviceConnector = {
      border: 0,
      height: '1px',
      margin: '5px 0 0 0',
      padding: 0,
      background: 'rgba(0,256,0,0.3)'
    };
    const styleDeviceContainer = {
      margin: 0
    };
    const styleDevice = {
      borderBottomLeftRadius: '10px',
      borderBottomRightRadius: '10px',
      width: isMinimized ? '200px' : '200px',
      padding: '3px',
      fontSize: '12px',
      textAlign: 'center'
    };
    const styleDeviceLeft = {
      ...styleDevice,
      marginRight: isMinimized ? '10px' : '40px'
    };
    const styleDeviceRight = {
      ...styleDevice,
      marginLeft: isMinimized ? '10px' : '40px'
    };
    const styleDeviceCenter = {
      ...styleDevice,
      margin: isMinimized ? '5px' : '10px'
    };
    const classActive = `${classes.infoData} ${classes.infoActive}`;
    const classLabel = isMinimized
      ? `${classes.infoLabel} ${classes.infoLabelMinimized}`
      : classes.infoLabel;
    const classData = isMinimized
      ? `${classes.infoData} ${classes.infoDataMinimized}`
      : classes.infoData;

    // FAKE DATA - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const scriptEditors = [
      { uaddr: 'UADDR01', name: 'Corey', script: 'Fish' },
      { uaddr: 'UADDR02', name: 'Noel', script: 'Algae' },
      { uaddr: 'UADDR03', name: 'Joshua', script: 'Poop' }
    ];
    const controllers = [
      { uaddr: 'UADDR04', name: 'Ben', instance: 'Fish01' },
      { uaddr: 'UADDR05', name: 'Sri', instance: 'Fish02' },
      { uaddr: 'UADDR06', name: 'Sri', instance: 'Fish02' },
      { uaddr: 'UADDR07', name: 'Sri', instance: 'Fish02' },
      { uaddr: 'UADDR08', name: 'Sri', instance: 'Fish02' },
      { uaddr: 'UADDR09', name: 'Sri', instance: 'Fish02' }
    ];
    const observers = [
      { uaddr: 'UADDR10', name: 'Eric' },
      { uaddr: 'UADDR11', name: 'Matt' },
      { uaddr: 'UADDR12', name: 'Eric' },
      { uaddr: 'UADDR13', name: 'Matt' }
    ];

    // JSX CONSTRUCTORS - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    // OLD Development Code Demo
    // const scriptEditorsJSX = scriptEditors.map(e => (
    //   <div style={styleDeviceContainer} key={e.uaddr}>
    //     <hr style={styleDeviceConnector} />
    //     <div style={styleDeviceLeft} className={classes.filledOutline}>
    //       <div className={classLabel}>{e.uaddr}:</div>
    //       <div className={classData}>{e.name}</div>
    //       <div className={classLabel}>Script:</div>
    //       <div className={classData}>{e.script}</div>
    //     </div>
    //   </div>
    // ));
    // const controllersJSX = controllers.map(e => (
    //   <div style={styleDeviceContainer} key={e.uaddr}>
    //     <hr style={styleDeviceConnector} />
    //     <div style={styleDeviceRight} className={classes.filledOutline}>
    //       <div className={classLabel}>{e.uaddr}:</div>
    //       <div className={classData}>{e.name}</div>
    //       <div className={classLabel}>Control:</div>
    //       <div className={classData}>{e.instance}</div>
    //     </div>
    //   </div>
    // ));
    // const observersJSX = observers.map(e => (
    //   <div
    //     style={styleDeviceCenter}
    //     className={classes.filledOutline}
    //     key={e.uaddr}
    //   >
    //     <div className={classLabel}>{e.uaddr}:</div>
    //     <div className={classData}>{e.name}</div>
    //     <div className={classLabel}>Observing</div>
    //   </div>
    // ));

    // charcontrollers
    const devicesJSX = devices.map(d => (
      <div
        style={styleDeviceCenter}
        className={classes.filledOutline}
        key={d.udid}
      >
        <div className={classLabel}>Device</div>
        <div className={classActive} style={{ width: 'min-content' }}>
          {FriendlifyName(d.meta.uaddr)}
        </div>
      </div>
    ));

    // pozyx, ptrack, or faketrack tags via inputDefs
    const tagsJSX = tags.map(t => (
      <div style={styleDeviceCenter} className={classes.filledOutline} key={t.id}>
        <div className={classLabel}>Device</div>
        <div
          className={classActive}
          style={{ width: 'min-content', paddingRight: '5px' }}
        >
          {t.label}
        </div>
        <select
          value={t.bpid}
          className={classes.select}
          style={{ minHeight: '25px', fontSize: '12px' }}
          onChange={event => this.HandleTagSelect(event, t.id)}
        >
          {bpNamesList.map(b => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>
    ));

    return (
      <PanelChrome
        id={id} // used by click handler to identify panel
        title={title}
        onClick={onClick}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          {/* <div style={{ display: 'flex', flexDirection: 'column' }}>
            {scriptEditorsJSX}
          </div> */}
          {/* <div style={styleDevice} className={classes.outline}>
            SIMULATION:
            <br />
            {simulationName}
          </div> */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* {controllersJSX} */}
            {devicesJSX}
            {tagsJSX}
          </div>
        </div>
        <div style={{ display: 'flex' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}
          >
            {/* {observersJSX} */}
          </div>
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelMap);
