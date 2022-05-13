/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Mission Control - Teacher/Admin/Projector interface

  * Manage network devices
  * Control simulation playback

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import UR from '@gemstep/ursys/client';

/// PANELS ////////////////////////////////////////////////////////////////////
import PanelMap from './components/PanelMap';
import PanelBlueprints from './components/PanelBlueprints';

/// TESTS /////////////////////////////////////////////////////////////////////
// import 'modules/tests/test-parser'; // test parser evaluation

// this is where classes.* for css are defined
import { useStylesHOC } from './helpers/page-xui-styles';
import './scrollbar.css';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('MISSIONCONTROL');
const DBG = true;

/// PANEL CONFIGURATIONS //////////////////////////////////////////////////////
const PANEL_CONFIG = new Map();
PANEL_CONFIG.set('map', '50% auto 150px'); // columns
PANEL_CONFIG.set('blueprints', '50% auto 150px'); // columns
PANEL_CONFIG.set('sim', '15% auto 150px'); // columns

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class MissionControl extends React.Component {
  constructor() {
    super();
    this.OnPanelClick = this.OnPanelClick.bind(this);
  }

  componentDidMount() {}

  componentWillUnmount() {}

  OnPanelClick(id) {
    this.props.toggleMinimized();
  }

  render() {
    const { projId, devices, bpNamesList, minimized, classes } = this.props;

    return (
      <>
        <PanelMap
          id="map"
          devices={devices}
          isMinimized={minimized}
          onClick={this.OnPanelClick}
        />
        <PanelBlueprints
          id="blueprints"
          projId={projId}
          bpNamesList={bpNamesList}
        />
      </>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStylesHOC)(MissionControl);
