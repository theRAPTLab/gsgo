/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Map Editor

  * Define instances to be generated
  * Set init properties for the instances
  * Update init script

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import { GetAllInstances } from 'modules/datacore/dc-agents';
import UR from '@gemstep/ursys/client';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////

/// PANELS ////////////////////////////////////////////////////////////////////
import PanelSimulation from './components/PanelSimulation';
import PanelBlueprints from './components/PanelBlueprints';
import PanelInstances from './components/PanelInstances';
import PanelMapInstances from './components/PanelMapInstances';
import PanelMessage from './components/PanelMessage';

/// TESTS /////////////////////////////////////////////////////////////////////
// import 'modules/tests/test-parser'; // test parser evaluation

// HACK DATA LOADING
// Need to import to load data even though it is not explicitly called
// This should be moved to the server
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
PANEL_CONFIG.set('map', '50% auto 0px'); // columns
PANEL_CONFIG.set('blueprints', '50% auto 0px'); // columns
PANEL_CONFIG.set('sim', '15% auto 0px'); // columns

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

    // Call Places after sim has been loaded
    UR.SystemHook('UR/APP_START', () => {
      console.error('APP_START');
      console.error('PLACES!');
      this.CallSimPlaces();
    });
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
    UR.UnhandleMessage('SCRIPT_UI_CHANGED', this.OnScriptUpdate);
    UR.UnhandleMessage('DRAG_END', this.HandleDragEnd);
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
      () => this.CallSimPlaces() // necessary to update screen after overall model updates
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

    const x = Number.parseFloat(agent.prop.x.value).toFixed(2);
    const y = Number.parseFloat(agent.prop.y.value).toFixed(2);

    UR.RaiseMessage('NET:INSTANCE_UPDATE_POSITION', {
      modelId,
      instanceName: agent.meta.name,
      updatedData: { x, y }
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
          style={{ backgroundColor: 'transparent', gridTemplateRows: '20% auto' }}
        >
          <PanelBlueprints id="blueprints" agents={agents} enableAdd />
          <PanelMapInstances id="instances" mapInstanceSpec={mapInstanceSpec} />
        </div>
        <div id="console-main" className={classes.main}>
          <PanelSimulation id="sim" onClick={this.OnPanelClick} />
        </div>
        {/* Instances not necessary for MapEditor
        <div id="console-right" className={classes.right}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <PanelInstances id="instances" instances={instances} />
          </div>
        </div> */}
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
