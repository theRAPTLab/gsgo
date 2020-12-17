/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Compiler - Script Parsing and Compiling

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import UR from '@gemstep/ursys/client';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
import * as SIM from 'modules/sim/api-sim'; // needed to register keywords for Prism
import * as GLOBAL from 'modules/datacore/dc-globals';
import * as DATACORE from 'modules/datacore';

/// CODE EDIT + HIGHLIGHTING //////////////////////////////////////////////////
import * as Prism from '../../lib/vendor/prism_extended';
import { CodeJar } from '../../lib/vendor/codejar';
import '../../lib/vendor/prism_extended.css';

/// PANELS ////////////////////////////////////////////////////////////////////
import PanelMap from './components/PanelMap';
import PanelSimViewer from './components/PanelSimViewer';
import PanelPlayback from './components/PanelPlayback';
import PanelInspector from './components/PanelInspector';
import PanelInstances from './components/PanelInstances';

/// TESTS /////////////////////////////////////////////////////////////////////
// import 'modules/tests/test-parser'; // test parser evaluation

// this is where classes.* for css are defined
import { useStylesHOC } from './elements/page-xui-styles';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('MISSIONCONTROL');
const DBG = true;

/// HARCODED SOURCE ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// URSYS SYSHOOKS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Is this necessary?  Causing async "Uncaught (in promise) undefined" error
// UR.SystemHook(
//   'UR/LOAD_ASSETS',
//   () =>
//     new Promise((resolve, reject) => {
//       if (DBG) console.log(...PR('LOADING ASSET MANIFEST @ UR/LOAD_ASSETS...'));
//       (async () => {
//         let map = await GLOBAL.LoadAssets('static/assets.json');
//         if (DBG) console.log(...PR('ASSETS LOADED'));
//         // Compiler.jsx starts sim, but we shouldn't need to?
//         // SIM.StartSimulation();
//         // if (DBG) console.log(...PR('SIMULATION STARTED'));
//       })();
//       resolve();
//     })
// );

/// PANEL CONFIGURATIONS //////////////////////////////////////////////////////
const panelConfig = new Map();
panelConfig.set('map', '50% auto 100px'); // columns
panelConfig.set('sim', '15% auto 100px'); // columns

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class MissionControl extends React.Component {
  constructor() {
    super();
    this.state = {
      panelConfiguration: 'map'
    };
    this.OnHomeClick = this.OnHomeClick.bind(this);
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

  OnHomeClick() {
    window.location = '/app/login';
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
    return (
      <div
        className={classes.root}
        style={{
          gridTemplateColumns: panelConfig.get(panelConfiguration)
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
          <button type="button" onClick={this.OnHomeClick}>
            HOME
          </button>
        </div>
        <div
          id="console-left"
          className={classes.left} // commented out b/c adding a padding
          style={{ backgroundColor: 'transparent' }}
        >
          <PanelMap
            id="map"
            isMinimized={panelConfiguration !== 'map'}
            onClick={this.OnPanelClick}
          />
          <PanelInstances id="instances" />
        </div>
        <div id="console-main" className={classes.main}>
          <PanelSimViewer id="sim" onClick={this.OnPanelClick} />
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
