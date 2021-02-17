/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ScriptEditor - Script Editing

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import UR from '@gemstep/ursys/client';

/// PANELS ////////////////////////////////////////////////////////////////////
import PanelSimViewer from './components/PanelSimViewer';
import PanelSelectAgent from './components/PanelSelectAgent';
import PanelScript from './components/PanelScript';
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
const PR = UR.PrefixUtil('SCRIPTEDITOR');
const DBG = true;

/// PANEL CONFIGURATIONS //////////////////////////////////////////////////////
const PANEL_CONFIG = new Map();
PANEL_CONFIG.set('select', '50% auto 0px'); // columns
PANEL_CONFIG.set('script', '50% auto 0px'); // columns
PANEL_CONFIG.set('sim', '50% auto 0px'); // columns

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class ScriptEditor extends React.Component {
  constructor() {
    super();
    this.state = {
      panelConfiguration: 'select',
      modelId: '',
      model: {},
      scriptId: '',
      script: '',
      instances: [],
      monitoredInstances: [],
      message: '',
      messageIsError: false
    };
    // bind
    this.CleanupComponents = this.CleanupComponents.bind(this);
    this.LoadModel = this.LoadModel.bind(this);
    this.OnSimDataUpdate = this.OnSimDataUpdate.bind(this);
    this.UnRegisterInstances = this.UnRegisterInstances.bind(this);
    this.OnInstanceUpdate = this.OnInstanceUpdate.bind(this);
    this.OnInspectorUpdate = this.OnInspectorUpdate.bind(this);
    this.OnPanelClick = this.OnPanelClick.bind(this);
    this.OnSelectScript = this.OnSelectScript.bind(this);
    this.OnDebugMessage = this.OnDebugMessage.bind(this);
    // hooks
    // Sent by PanelSelectAgent
    UR.RegisterMessage('HACK_SELECT_AGENT', this.OnSelectScript);
    UR.RegisterMessage('HACK_DEBUG_MESSAGE', this.OnDebugMessage);
    UR.RegisterMessage('HACK_SIMDATA_UPDATE_MODEL', this.OnSimDataUpdate);
    UR.RegisterMessage('NET:INSTANCES_UPDATED', this.OnInstanceUpdate);
    UR.RegisterMessage('NET:INSPECTOR_UPDATE', this.OnInspectorUpdate);
  }

  componentDidMount() {
    const params = new URLSearchParams(window.location.search.substring(1));
    const modelId = params.get('model');
    const scriptId = params.get('script');
    document.title = `GEMSTEP SCRIPT EDITOR: ${modelId}`;

    // start URSYS
    UR.SystemConfig({ autoRun: true });

    window.addEventListener('beforeunload', this.CleanupComponents);

    // Load Model Data
    this.setState({ modelId, scriptId }, () => {
      this.LoadModel(modelId);
    });
  }

  componentDidCatch(e) {
    console.log(e);
  }

  componentWillUnmount() {
    this.CleanupComponents();
    window.removeEventListener('beforeunload', this.CleanupComponents);
  }

  CleanupComponents() {
    this.UnRegisterInstances();
    UR.UnregisterMessage('HACK_SELECT_AGENT', this.OnSelectScript);
    UR.UnregisterMessage('HACK_DEBUG_MESSAGE', this.OnDebugMessage);
    UR.UnregisterMessage('HACK_SIMDATA_UPDATE_MODEL', this.OnSimDataUpdate);
    UR.UnregisterMessage('NET:INSTANCES_UPDATED', this.OnInstanceUpdate);
    UR.UnregisterMessage('NET:INSPECTOR_UPDATE', this.OnInspectorUpdate);
  }

  /**
   * HACK
   * This requests model data from sim-data.
   * sim-data will respond with `HACK_SIMDATA_UPDATE_MODEL
   * which is handled by OnSimDataUpdate, below.
   *
   * REVIEW: Should this be done with a callback instead?
   *
   * @param {String} modelId
   */
  LoadModel(modelId) {
    UR.RaiseMessage('HACK_SIMDATA_REQUEST_MODEL', { modelId });
  }

  /**
   * Second part of LoadModel
   * This saves the model data to the local state
   * and loads the current script if it's been specified
   * @param {Object} data
   */
  OnSimDataUpdate(data) {
    const { scriptId } = this.state;
    this.setState({ model: data.model }, () => {
      if (scriptId) {
        this.OnSelectScript(scriptId);
      }
    });
  }

  UnRegisterInstances() {
    const { instances, monitoredInstances } = this.state;
    if (!instances) return;
    instances.forEach(i => {
      const name = i.name || i.meta.name; // instance spec || GAgent
      UR.RaiseMessage('NET:INSPECTOR_UNREGISTER', { name });
      monitoredInstances.splice(monitoredInstances.indexOf(name), 1);
    });
    this.setState({ monitoredInstances });
  }

  /**
   * Handler for `NET:INSTANCES_UPDATED`
   * NET:INSTANCES_UPDATED is sent by sim-agents.AgentsProgram after instances are created.
   * We use the list of instances created for this blueprint to register
   * the instances for inspector monitoring.
   * This is also called when other ScriptEditors on the network submit
   * scripts and trigger NET:INSTANCES_UPDATED.  In that situation,
   * we only update if the instance isn't already being monitored.
   * @param {Object} data { instances: [...instances]}
   *                       where 'instances' are instanceSpecs: {name, blueprint, init}
   */
  OnInstanceUpdate(data) {
    const { scriptId, monitoredInstances } = this.state;
    // Only show instances for the current blueprint
    const instances = data.instances.filter(i => {
      return i.blueprint === scriptId;
    });
    // Register the instances for monitoring
    instances.forEach(i => {
      if (monitoredInstances.includes(i.name)) return; // skip if already monitored
      UR.RaiseMessage('NET:INSPECTOR_REGISTER', {
        name: i.name
      });
      monitoredInstances.push(i.name);
    });
    this.setState({ instances, monitoredInstances });
  }

  /**
   * Handler for `NET:INSPECTOR_UPDATE`
   * NET:INSPECTOR_UPDATE is sent by PanelSimulation on every sim loop
   * with agent information for every registered instance
   * @param {Object} data { agents: [...agents]}
   *                 wHere `agents` are gagents
   */
  OnInspectorUpdate(data) {
    // Only show instances for the current blueprint
    const { scriptId } = this.state;
    if (!data || data.agents === undefined) {
      console.error('OnInspectorUpdate got bad data', data);
      return;
    }
    const instances = data.agents.filter(i => {
      return i.blueprint.name === scriptId;
    });
    this.setState({ instances });
  }

  OnPanelClick(id) {
    if (id === 'sim') return; // don't do anything if user clicks on sim panel
    this.setState({
      panelConfiguration: id
    });
  }

  OnSelectScript(scriptId) {
    this.UnRegisterInstances();
    const { model, modelId } = this.state;
    if (model === undefined || model.scripts === undefined) {
      console.error(
        'ScriptEditor.OnSelectAgent: model or model.scripts is not defined',
        model,
        model.scripts
      );
      return; // no scripts defined
    }
    const agent = model.scripts.find(s => s.id === scriptId);
    const script = agent && agent.script ? agent.script : {};

    // add script to URL
    history.pushState(
      {},
      '',
      `/app/scripteditor?model=${modelId}&script=${scriptId}`
    );

    this.setState({
      panelConfiguration: 'script',
      script,
      scriptId
    });
  }

  OnDebugMessage(data) {
    this.setState({
      message: data.message,
      messageIsError: true
    });
  }

  /*  Renders 2-col, 3-row grid with TOP and BOTTOM spanning both columns.
   *  The base styles from page-styles are overidden with inline styles to
   *  make this happen.
   */
  render() {
    const {
      panelConfiguration,
      modelId,
      model,
      scriptId,
      script,
      instances,
      message,
      messageIsError
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
            <span style={{ fontSize: '32px' }}>SCRIPT EDITOR {modelId}</span> UGLY
            DEVELOPER MODE
          </div>
          <Link
            to={{ pathname: `/app/model?model=${modelId}` }}
            className={classes.navButton}
          >
            Back to MODEL
          </Link>
        </div>
        <div id="console-left" className={classes.left}>
          {panelConfiguration === 'select' && (
            <PanelSelectAgent
              id="select"
              agents={agents}
              onClick={this.OnPanelClick}
            />
          )}
          {panelConfiguration === 'script' && (
            <PanelScript
              id="script"
              script={script}
              onClick={this.OnPanelClick}
            />
          )}
        </div>
        <div id="console-main" className={classes.main}>
          <PanelSimViewer id="sim" onClick={this.OnPanelClick} />
        </div>
        <div
          id="console-bottom"
          className={clsx(classes.cell, classes.bottom)}
          style={{ gridColumnEnd: 'span 3' }}
        >
          <div style={{ display: 'flex' }}>
            <PanelMessage message={message} isError={messageIsError} />
            <PanelInstances
              id="instances"
              instances={instances}
              disallowDeRegister
            />
          </div>
        </div>
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStylesHOC)(ScriptEditor);
