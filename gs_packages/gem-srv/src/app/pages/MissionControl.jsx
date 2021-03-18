/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Mission Control - Teacher/Admin/Projector interface

  * Manage network devices
  * Control simulation playback

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useState } from 'react';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
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
import MissionMapEditor from './MissionMapEditor';
import MissionRun from './MissionRun';

import PanelPlayback from './components/PanelPlayback';
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
PANEL_CONFIG.set('run', '15% auto 150px'); // columns
PANEL_CONFIG.set('run-map', '50% auto 150px'); // columns
PANEL_CONFIG.set('edit', '15% auto 0px'); // columns

const StyledToggleButton = withStyles(theme => ({
  root: {
    color: 'rgba(0,156,156,1)',
    backgroundColor: 'rgba(60,256,256,0.1)',
    '&:hover': {
      color: 'black',
      backgroundColor: '#6effff'
    },
    '&.Mui-selected': {
      color: '#6effff',
      backgroundColor: 'rgba(60,256,256,0.3)',
      '&:hover': {
        color: 'black',
        backgroundColor: '#6effff'
      }
    }
  }
}))(ToggleButton);

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class MissionControl extends React.Component {
  constructor() {
    super();
    this.state = {
      panelConfiguration: 'run',
      message: '',
      modelId: '',
      model: {},
      instances: [],
      runIsMinimized: true
    };

    // Data Update Handlers
    this.LoadModel = this.LoadModel.bind(this);
    this.DoScriptUpdate = this.DoScriptUpdate.bind(this);
    this.OnSimDataUpdate = this.OnSimDataUpdate.bind(this);
    this.CallSimPlaces = this.CallSimPlaces.bind(this);
    this.DoSimReset = this.DoSimReset.bind(this);
    this.OnInspectorUpdate = this.OnInspectorUpdate.bind(this);
    UR.HandleMessage('NET:HACK_SCRIPT_UPDATE', this.DoScriptUpdate);
    UR.HandleMessage('NET:UPDATE_MODEL', this.OnSimDataUpdate);
    UR.HandleMessage('NET:HACK_SIM_RESET', this.DoSimReset);
    UR.HandleMessage('NET:INSPECTOR_UPDATE', this.OnInspectorUpdate);

    // Instance Interaction Handlers
    this.HandleDragEnd = this.HandleDragEnd.bind(this);
    this.HandleSimInstanceClick = this.HandleSimInstanceClick.bind(this);
    this.HandleSimInstanceHoverOver = this.HandleSimInstanceHoverOver.bind(this);
    this.HandleSimInstanceHoverOut = this.HandleSimInstanceHoverOut.bind(this);
    UR.HandleMessage('DRAG_END', this.HandleDragEnd);
    UR.HandleMessage('SIM_INSTANCE_CLICK', this.HandleSimInstanceClick);
    UR.HandleMessage('SIM_INSTANCE_HOVEROVER', this.HandleSimInstanceHoverOver);
    UR.HandleMessage('SIM_INSTANCE_HOVEROUT', this.HandleSimInstanceHoverOut);

    // Panel UI Configuration
    this.OnToggleRunEdit = this.OnToggleRunEdit.bind(this);
    this.OnToggleNetworkMapSize = this.OnToggleNetworkMapSize.bind(this);
    this.OnPanelClick = this.OnPanelClick.bind(this);

    // System Hooks
    UR.SystemHook('SIM/READY', () => {
      console.error('sim/READY!');
      const { modelId } = this.state;
      this.LoadModel(modelId);
    });
    // TEST: Probably not necessary so long as SIM/READY is only called once
    UR.SystemHook('SIM/STAGED', () => {
      console.warn('SIM/STAGED!');
      // const { modelId } = this.state;
      // this.LoadModel(modelId);
    });
  }

  componentDidMount() {
    const params = new URLSearchParams(window.location.search.substring(1));
    const modelId = params.get('model');

    // No model selected, go back to login to select model
    if (!modelId) window.location = '/app/login';

    this.setState({ modelId });
    document.title = `GEMSTEP MISSION CONTROL ${modelId}`;
    // start URSYS
    UR.SystemAppConfig({ autoRun: true });
  }

  componentDidCatch(e) {
    console.log(e);
  }

  componentWillUnmount() {
    UR.UnhandleMessage('NET:HACK_SCRIPT_UPDATE', this.DoScriptUpdate);
    UR.UnhandleMessage('NET:UPDATE_MODEL', this.OnSimDataUpdate);
    UR.UnhandleMessage('NET:INSPECTOR_UPDATE', this.OnInspectorUpdate);
    UR.UnhandleMessage('DRAG_END', this.HandleDragEnd);
    UR.UnhandleMessage('SIM_INSTANCE_CLICK', this.HandleSimInstanceClick);
    UR.UnhandleMessage('SIM_INSTANCE_HOVEROVER', this.HandleSimInstanceHoverOver);
    UR.UnhandleMessage('SIM_INSTANCE_HOVEROUT', this.HandleSimInstanceHoverOut);
    UR.UnhandleMessage('NET:HACK_SIM_RESET', this.DoSimReset);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// DATA UPDATE HANDLERS
  ///
  LoadModel(modelId) {
    // Direct SimData API Call
    // This bypasses OnSimDataUpdate
    const model = SimData.GetModel(modelId);
    this.setState(
      { model },
      () => this.CallSimPlaces() // necessary to update screen after overall model updates
    );
  }
  OnSimDataUpdate(data) {
    this.setState(
      { model: data.model },
      // Need to call SimPlaces here after prop updates or agents won't reposition
      () => this.CallSimPlaces()
    );
  }
  /**
   * User has submitted a new script, just update message
   * PanelSimulation handles instance creation
   * @param {object} data { script }
   */
  DoScriptUpdate(data) {
    const firstline = data.script.match(/.*/)[0];
    this.setState(state => ({
      message: `${state.message}Received script ${firstline}\n`
    }));
  }
  CallSimPlaces() {
    UR.RaiseMessage('*:SIM_PLACES');
  }
  DoSimReset() {
    this.setState(
      {
        model: {},
        instances: []
      },
      () => this.LoadModel()
    );
  }
  /**
   * Handler for `NET:INSPECTOR_UPDATE`
   * NET:INSPECTOR_UPDATE is sent by PanelSimulation on every sim loop
   * with agent information for every registered instance
   * @param {Object} data { agents: [...agents]}
   *                 wHere `agents` are gagents
   */
  OnInspectorUpdate(data) {
    const { panelConfiguration } = this.state;

    // Don't do updates if we're editing the map
    // This triggers state changes, which causes InstanceEditor
    // and prop.tsx to re-render AMD text input fields to lose focus
    if (panelConfiguration === 'edit') return;

    if (!data || data.agents === undefined) {
      console.error('OnInspectorUpdate got bad data', data);
      return;
    }
    // merge the two lists, replacing instance specs with agents
    const map = new Map();
    const allInstances = GetAllInstances();
    allInstances.forEach(i => {
      map.set(i.id, i);
    });
    data.agents.forEach(a => {
      map.set(a.id, a);
    });
    const instances = Array.from(map.values());
    this.setState({ instances });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// INSTANCE INTERACTION HANDLERS
  ///
  HandleDragEnd(data) {
    const agent = data.agent;
    console.log('dropped', agent.prop.x.value, agent.prop.y.value);
    const { modelId } = this.state;
    const x = Number.parseFloat(agent.prop.x.value).toFixed(2);
    const y = Number.parseFloat(agent.prop.y.value).toFixed(2);
    SimData.InstanceUpdatePosition({
      modelId,
      instanceId: agent.id,
      updatedData: { x, y }
    });
  }
  /**
   * User clicked on agent instance in simulation view
   * If Map Editor is open, then when the user clicks
   * on an instance in the simulation view, we want to
   * select it for editing.
   * @param {object} data { agentId }
   */
  HandleSimInstanceClick(data) {
    const { modelId } = this.state;
    SimData.InstanceRequestEdit({ modelId, agentId: data.agentId });
  }
  HandleSimInstanceHoverOver(data) {
    const { modelId } = this.state;
    SimData.InstanceHoverOver({ modelId, agentId: data.agentId });
  }
  HandleSimInstanceHoverOut(data) {
    const { modelId } = this.state;
    SimData.InstanceHoverOut({ modelId, agentId: data.agentId });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// PANEL UI CONFIGURATION
  ///
  OnToggleRunEdit(e, val) {
    this.setState({ panelConfiguration: val });
  }
  OnToggleNetworkMapSize() {
    this.setState(state => ({
      panelConfiguration: state.panelConfiguration === 'run' ? 'run-map' : 'run',
      runIsMinimized: !state.runIsMinimized
    }));
  }
  OnPanelClick(id) {
    this.setState({
      panelConfiguration: id
    });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// RENDER
  ///
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
      runIsMinimized
    } = this.state;
    const { classes } = this.props;

    const agents =
      model && model.scripts
        ? model.scripts.map(s => ({ id: s.id, label: s.label }))
        : [];

    const jsxRunOrEdit = (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          height: '50px',
          width: '100%'
        }}
      >
        <ToggleButtonGroup
          value={panelConfiguration}
          exclusive
          onChange={this.OnToggleRunEdit}
        >
          <StyledToggleButton value="run">Run Model</StyledToggleButton>
          <StyledToggleButton value="edit">Edit Map</StyledToggleButton>
        </ToggleButtonGroup>
      </div>
    );

    const jsxLeft =
      panelConfiguration === 'edit' ? (
        <MissionMapEditor model={model} />
      ) : (
        <MissionRun
          model={model}
          toggleMinimized={this.OnToggleNetworkMapSize}
          minimized={runIsMinimized}
        />
      );

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
          <div
            style={{
              display: 'grid',
              gridTemplateRows:
                panelConfiguration === 'edit' ? '60px auto' : '60px auto 100px',
              overflow: 'hidden'
            }}
          >
            {jsxRunOrEdit}
            {jsxLeft}
          </div>
        </div>
        <div id="console-main" className={classes.main}>
          <PanelSimulation id="sim" model={model} onClick={this.OnPanelClick} />
        </div>
        <div id="console-right" className={classes.right}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <PanelPlayback id="playback" model={model} />
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
