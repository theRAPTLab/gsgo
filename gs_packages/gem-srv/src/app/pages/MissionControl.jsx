/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Mission Control - Teacher/Admin/Projector interface

  * Manage network devices
  * Control simulation playback

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import UR from '@gemstep/ursys/client';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
import * as SIM from 'modules/sim/api-sim'; // needed to register keywords for Prism
import * as GLOBAL from 'modules/datacore/dc-globals';
import * as DATACORE from 'modules/datacore';

/// PANELS ////////////////////////////////////////////////////////////////////
import PanelMap from './components/PanelMap';
import PanelSimulation from './components/PanelSimulation';
import PanelPlayback from './components/PanelPlayback';
import PanelInspector from './components/PanelInspector';
import PanelBlueprints from './components/PanelBlueprints';
import PanelInstances from './components/PanelInstances';

/// TESTS /////////////////////////////////////////////////////////////////////
// import 'modules/tests/test-parser'; // test parser evaluation

// this is where classes.* for css are defined
import { useStylesHOC } from './elements/page-xui-styles';
import './scrollbar.css';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('MISSIONCONTROL');
const DBG = true;

/// PANEL CONFIGURATIONS //////////////////////////////////////////////////////
const PANEL_CONFIG = new Map();
PANEL_CONFIG.set('map', '50% auto 100px'); // columns
PANEL_CONFIG.set('blueprints', '50% auto 100px'); // columns
PANEL_CONFIG.set('sim', '15% auto 100px'); // columns

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class MissionControl extends React.Component {
  constructor() {
    super();
    this.state = {
      panelConfiguration: 'sim'
    };
    this.OnHomeClick = this.OnModelClick.bind(this);
    this.OnPanelClick = this.OnPanelClick.bind(this);
  }

  componentDidMount() {
    document.title = 'GEMSTEP MISSION CONTROL';
    // start URSYS
    UR.SystemConfig({ autoRun: true });
  }

  componentDidCatch(e) {
    console.log(e);
  }

  componentWillUnmount() {
    console.log('componentWillUnmount');
  }

  OnModelClick() {
    window.location = '/app/model';
  }

  OnPanelClick(id) {
    console.log('click', id); // e, e.target, e.target.value);
    this.setState({
      panelConfiguration: id
    });
  }

  /*  Renders 2-col, 3-row grid with TOP and BOTTOM spanning both columns.
   *  The base styles from page-styles are overidden with inline styles to
   *  make this happen.
   */
  render() {
    const { panelConfiguration } = this.state;
    const { classes } = this.props;

    /// This should be loaded from the db
    /// Hacked in for now
    const agents = [
      { id: 'fish', label: 'Fish' },
      { id: 'algae', label: 'Algae' },
      { id: 'lightbeam', label: 'Lightbeam' },
      { id: 'poop', label: 'Poop', editor: 'UADDR01: Ben' }
    ];

    return (
      <div
        className={classes.root}
        style={{
          gridTemplateColumns: PANEL_CONFIG.get(panelConfiguration)
        }}
      >
        <div
          id="console-top"
          className={clsx(classes.cell, classes.top)}
          style={{ gridColumnEnd: 'span 3', display: 'flex' }}
        >
          <div style={{ flexGrow: '1' }}>
            <span style={{ fontSize: '32px' }}>MISSION CONTROL</span> UGLY
            DEVELOPER MODE
          </div>
          <button type="button" onClick={this.OnModelClick}>
            Back to MODEL
          </button>
        </div>
        <div
          id="console-left"
          className={classes.left} // commented out b/c adding a padding
          style={{ backgroundColor: 'transparent' }}
        >
          {/* Map disabled for now
            <PanelMap
            id="map"
            isMinimized={panelConfiguration !== 'map'}
            onClick={this.OnPanelClick}
          /> */}
          <PanelBlueprints id="blueprints" agents={agents} />
          <PanelInstances id="instances" />
        </div>
        <div id="console-main" className={classes.main}>
          <PanelSimulation id="sim" onClick={this.OnPanelClick} />
        </div>
        <div id="console-right" className={classes.right}>
          <PanelPlayback id="playback" />
          <PanelInspector isActive />
        </div>
        <div
          id="console-bottom"
          className={clsx(classes.cell, classes.bottom)}
          style={{ gridColumnEnd: 'span 3' }}
        >
          console-bottom
        </div>
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStylesHOC)(MissionControl);
