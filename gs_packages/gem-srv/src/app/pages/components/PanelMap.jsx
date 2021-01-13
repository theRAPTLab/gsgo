import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';

class PanelMap extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'NETWORK / DEVICES (FAKE DATA)',
      simulationName: 'Aquatic Ecosystems'
    };
  }

  render() {
    const { title, simulationName } = this.state;
    const { id, isMinimized, onClick, classes } = this.props;

    // STYLES - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const styleDeviceConnector = {
      border: 0,
      height: '1px',
      margin: '20px 0 0 0',
      padding: 0,
      background: 'rgba(0,256,0,0.3)'
    };
    const styleDeviceContainer = {
      margin: 0
    };
    const styleDevice = {
      borderBottomLeftRadius: '10px',
      borderBottomRightRadius: '10px',
      width: isMinimized ? '70px' : '200px',
      padding: '3px',
      fontSize: '12px'
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
    const classLabel = isMinimized
      ? `${classes.infoLabel} ${classes.infoLabelMinimized}`
      : classes.infoLabel;
    const classData = isMinimized
      ? `${classes.infoData} ${classes.infoDataMinimized}`
      : classes.infoData;

    // DATA - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
    const scriptEditorsJSX = scriptEditors.map(e => (
      <div style={styleDeviceContainer} key={e.uaddr}>
        <hr style={styleDeviceConnector} />
        <div style={styleDeviceLeft} className={classes.filledOutline}>
          <div className={classLabel}>{e.uaddr}:</div>
          <div className={classData}>{e.name}</div>
          <div className={classLabel}>Script:</div>
          <div className={classData}>{e.script}</div>
        </div>
      </div>
    ));
    const controllersJSX = controllers.map(e => (
      <div style={styleDeviceContainer} key={e.uaddr}>
        <hr style={styleDeviceConnector} />
        <div style={styleDeviceRight} className={classes.filledOutline}>
          <div className={classLabel}>{e.uaddr}:</div>
          <div className={classData}>{e.name}</div>
          <div className={classLabel}>Control:</div>
          <div className={classData}>{e.instance}</div>
        </div>
      </div>
    ));
    const observersJSX = observers.map(e => (
      <div
        style={styleDeviceCenter}
        className={classes.filledOutline}
        key={e.uaddr}
      >
        <div className={classLabel}>{e.uaddr}:</div>
        <div className={classData}>{e.name}</div>
        <div className={classLabel}>Observing</div>
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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {scriptEditorsJSX}
          </div>
          <div style={styleDevice} className={classes.outline}>
            SIMULATION:
            <br />
            {simulationName}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {controllersJSX}
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
            {observersJSX}
          </div>
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelMap);
