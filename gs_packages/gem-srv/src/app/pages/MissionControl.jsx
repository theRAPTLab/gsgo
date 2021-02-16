/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Mission Control - Teacher/Admin/Projector interface

  * Manage network devices
  * Control simulation playback

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import { GetAllInstances } from 'modules/datacore/dc-agents';
import UR from '@gemstep/ursys/client';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
import * as SIM from 'modules/sim/api-sim'; // needed to register keywords for Prism
import * as GLOBAL from 'modules/datacore/dc-globals';
import * as DATACORE from 'modules/datacore';

/// PANELS ////////////////////////////////////////////////////////////////////
import PanelMap from './components/PanelMap';
import PanelSimulation from './components/PanelSimulation';
import PanelPlayback from './components/PanelPlayback';
import PanelBlueprints from './components/PanelBlueprints';
import PanelInstances from './components/PanelInstances';
import PanelMessage from './components/PanelMessage';

/// TESTS /////////////////////////////////////////////////////////////////////
// import 'modules/tests/test-parser'; // test parser evaluation

// HACK DATA LOADING
import SimData from '../data/sim-data';

// this is where classes.* for css are defined
import { useStylesHOC } from './elements/page-xui-styles';
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
    this.state = {
      panelConfiguration: 'sim',
      message: '',
      modelId: '',
      model: {},
      instances: []
    };
    this.LoadModel = this.LoadModel.bind(this);
    this.OnSimDataUpdate = this.OnSimDataUpdate.bind(this);
    this.OnInstanceClick = this.OnInstanceClick.bind(this);
    this.OnInspectorUpdate = this.OnInspectorUpdate.bind(this);
    this.OnPanelClick = this.OnPanelClick.bind(this);
    this.DoScriptUpdate = this.DoScriptUpdate.bind(this);
    UR.RegisterMessage('NET:HACK_SCRIPT_UPDATE', this.DoScriptUpdate);
    UR.RegisterMessage('HACK_SIMDATA_UPDATE_MODEL', this.OnSimDataUpdate);
    UR.RegisterMessage('NET:INSPECTOR_UPDATE', this.OnInspectorUpdate);
  }

  componentDidMount() {
    const params = new URLSearchParams(window.location.search.substring(1));
    const modelId = params.get('model');
    this.setState({ modelId });
    document.title = `GEMSTEP MISSION CONTROL ${modelId}`;
    // start URSYS
    UR.SystemConfig({ autoRun: true });

    // Load Model Data
    this.LoadModel(modelId);
  }

  componentDidCatch(e) {
    console.log(e);
  }

  componentWillUnmount() {
    UR.UnregisterMessage('NET:HACK_SCRIPT_UPDATE', this.DoScriptUpdate);
    UR.UnregisterMessage('HACK_SIMDATA_UPDATE_MODEL', this.OnSimDataUpdate);
    UR.UnregisterMessage('NET:INSPECTOR_UPDATE', this.OnInspectorUpdate);
  }

  LoadModel(modelId) {
    // HACK
    // This requests model data from sim-data.
    // sim-data will respond with `HACK_SIMDATA_UPDATE_MODEL
    // REVIEW: Should the response come only to MissionControl and not be
    //         widely broadcast?
    UR.RaiseMessage('HACK_SIMDATA_REQUEST_MODEL', { modelId });
  }

  OnSimDataUpdate(data) {
    this.setState({ model: data.model });
  }

  OnInstanceClick(instanceName) {
    console.log('clicked on', instanceName);
  }

  /**
   * Handler for `NET:INSPECTOR_UPDATE`
   * NET:INSPECTOR_UPDATE is sent by PanelSimulation on every sim loop
   * with agent information for every registered instance
   * @param {Object} data { agents: [...agents]}
   *                 wHere `agents` are gagents
   */
  OnInspectorUpdate(data) {
    if (!data || data.agents === undefined) {
      console.error('OnInspectorUpdate got bad data', data);
      return;
    }
    // merge the two lists, replacing instance specs with agents
    const map = new Map();
    const allInstances = GetAllInstances();
    allInstances.forEach(i => {
      map.set(i.name, i);
    });
    data.agents.forEach(a => {
      map.set(a.meta.name, a);
    });
    const instances = Array.from(map.values());
    this.setState({ instances });
  }

  OnPanelClick(id) {
    this.setState({
      panelConfiguration: id
    });
  }

  DoScriptUpdate(data) {
    const firstline = data.script.match(/.*/)[0];
    this.setState(state => ({
      message: `${state.message}Received script ${firstline}\n`
    }));
  }

  /*  Renders 2-col, 3-row grid with TOP and BOTTOM spanning both columns.
   *  The base styles from page-styles are overidden with inline styles to
   *  make this happen.
   */
  render() {
    const { panelConfiguration, message, modelId, model, instances } = this.state;
    const { classes } = this.props;

    const agents =
      model && model.scripts
        ? model.scripts.map(s => ({ id: s.id, label: s.label }))
        : [];

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
            <span style={{ fontSize: '32px' }}>MISSION CONTROL {modelId}</span>{' '}
            {UR.ConnectionString()}
          </div>
          <Link
            to={{ pathname: `/app/model?model=${modelId}` }}
            className={classes.navButton}
          >
            Back to MODEL
          </Link>
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
          <PanelBlueprints id="blueprints" agents={agents} />
        </div>
        <div id="console-main" className={classes.main}>
          <PanelSimulation id="sim" onClick={this.OnPanelClick} />
        </div>
        <div id="console-right" className={classes.right}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <PanelPlayback id="playback" />
            <PanelInstances id="instances" instances={instances} />
          </div>
        </div>
        <div
          id="console-bottom"
          className={clsx(classes.cell, classes.bottom)}
          style={{ gridColumnEnd: 'span 3' }}
        >
          <PanelMessage message={message} />
        </div>
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStylesHOC)(MissionControl);
