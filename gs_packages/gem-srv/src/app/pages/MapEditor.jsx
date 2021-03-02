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
import PanelSimulation from './components/PanelSimulation';
import PanelBlueprints from './components/PanelBlueprints';
import PanelInstances from './components/PanelInstances';
import PanelMapInstances from './components/PanelMapInstances';
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
const PR = UR.PrefixUtil('MAPEDITOR');
const DBG = true;

/// PANEL CONFIGURATIONS //////////////////////////////////////////////////////
const PANEL_CONFIG = new Map();
PANEL_CONFIG.set('map', '50% auto 150px'); // columns
PANEL_CONFIG.set('blueprints', '50% auto 150px'); // columns
PANEL_CONFIG.set('sim', '15% auto 150px'); // columns

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class MapEditor extends React.Component {
  constructor() {
    super();
    this.state = {
      panelConfiguration: 'sim',
      message: '',
      modelId: '',
      model: {},
      instances: [],
      mapInstanceSpec: []
    };
    this.CallSimPlaces = this.CallSimPlaces.bind(this);
    this.LoadModel = this.LoadModel.bind(this);
    this.OnSimDataUpdate = this.OnSimDataUpdate.bind(this);
    this.OnInstanceClick = this.OnInstanceClick.bind(this);
    this.OnInspectorUpdate = this.OnInspectorUpdate.bind(this);
    this.OnPanelClick = this.OnPanelClick.bind(this);
    this.DoScriptUpdate = this.DoScriptUpdate.bind(this);
    this.OnScriptUpdate = this.OnScriptUpdate.bind(this);
    this.HandleDragEnd = this.HandleDragEnd.bind(this);
    UR.HandleMessage('NET:HACK_SCRIPT_UPDATE', this.DoScriptUpdate);
    UR.HandleMessage('HACK_SIMDATA_UPDATE_MODEL', this.OnSimDataUpdate);
    UR.HandleMessage('NET:INSPECTOR_UPDATE', this.OnInspectorUpdate);
    UR.HandleMessage('SCRIPT_UI_CHANGED', this.OnScriptUpdate);
    UR.HandleMessage('DRAG_END', this.HandleDragEnd);
  }

  componentDidMount() {
    const params = new URLSearchParams(window.location.search.substring(1));
    const modelId = params.get('model');
    this.setState({ modelId });
    document.title = `GEMSTEP MAP EDITOR ${modelId}`;
    // start URSYS
    UR.SystemAppConfig({ autoRun: true });

    // Load Model Data
    this.LoadModel(modelId);
  }

  componentDidCatch(e) {
    console.log(e);
  }

  componentWillUnmount() {
    UR.UnhandleMessage('NET:HACK_SCRIPT_UPDATE', this.DoScriptUpdate);
    UR.UnhandleMessage('HACK_SIMDATA_UPDATE_MODEL', this.OnSimDataUpdate);
    UR.UnhandleMessage('NET:INSPECTOR_UPDATE', this.OnInspectorUpdate);
  }

  CallSimPlaces() {
    UR.RaiseMessage('NET:SIM_PLACES');
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
    if (DBG) console.log(...PR('HACK_SIMDATA_UPDATE_MODEL', data));
    this.setState(
      {
        model: data.model,
        mapInstanceSpec: data.model.instances
      },
      () => {
        // REVIEW: Is this getting called too soon?
        this.CallSimPlaces();
      }
    );
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

  OnScriptUpdate(data) {
    // console.error('SCRIPT_UI_CHANGED', data);
  }

  HandleDragEnd(data) {
    const agent = data.agent;
    console.log('dropped', agent, 'x', agent.prop.x);

    const { modelId } = this.state;

    UR.RaiseMessage('NET:INSTANCE_UPDATE_POSITION', {
      modelId,
      instanceName: agent.meta.name,
      updatedData: {
        x: agent.prop.x.value,
        y: agent.prop.y.value
      }
    });
  }

  /*  Renders 2-col, 3-row grid with TOP and BOTTOM spanning both columns.
   *  The base styles from page-styles are overidden with inline styles to
   *  make this happen.
   */
  render() {
    const {
      panelConfiguration,
      message,
      modelId,
      model,
      instances,
      mapInstanceSpec
    } = this.state;
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
            <span style={{ fontSize: '32px' }}>MAP EDITOR {modelId}</span>{' '}
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
          <button
            className={classes.button}
            type="button"
            onClick={this.CallSimPlaces}
          >
            Load and Init
          </button>
          <PanelBlueprints id="blueprints" agents={agents} enableAdd />
          <PanelMapInstances id="instances" mapInstanceSpec={mapInstanceSpec} />
        </div>
        <div id="console-main" className={classes.main}>
          <PanelSimulation id="sim" onClick={this.OnPanelClick} />
        </div>
        <div id="console-right" className={classes.right}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
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
export default withStyles(useStylesHOC)(MapEditor);
