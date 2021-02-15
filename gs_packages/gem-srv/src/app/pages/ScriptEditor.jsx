/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ScriptEditor - Script Editing

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import UR from '@gemstep/ursys/client';

/// PANELS ////////////////////////////////////////////////////////////////////
import PanelSimViewer from './components/PanelSimViewer';
import PanelSelectAgent from './components/PanelSelectAgent';
import PanelScript from './components/PanelScript';
import PanelInspector from './components/PanelInspector';
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
      message: '',
      messageIsError: false
    };
    // bind
    this.LoadModel = this.LoadModel.bind(this);
    this.OnSimDataUpdate = this.OnSimDataUpdate.bind(this);
    this.OnBackToModelClick = this.OnBackToModelClick.bind(this);
    this.OnPanelClick = this.OnPanelClick.bind(this);
    this.OnSelectAgent = this.OnSelectAgent.bind(this);
    this.OnDebugMessage = this.OnDebugMessage.bind(this);
    // hooks
    // Sent by PanelSelectAgent
    UR.HandleMessage('HACK_SELECT_AGENT', this.OnSelectAgent);
    UR.HandleMessage('HACK_DEBUG_MESSAGE', this.OnDebugMessage);
    UR.HandleMessage('HACK_SIMDATA_UPDATE_MODEL', this.OnSimDataUpdate);
  }

  componentDidMount() {
    // start URSYS
    UR.SystemConfig({ autoRun: true });
    const params = new URLSearchParams(window.location.search.substring(1));
    const modelId = params.get('model');
    const scriptId = params.get('script');
    document.title = `GEMSTEP SCRIPT EDITOR: ${modelId}`;
    this.setState({ modelId, scriptId }, () => {
      // Load Model Data
      this.LoadModel(modelId);
    });
  }

  componentDidCatch(e) {
    console.log(e);
  }

  componentWillUnmount() {
    UR.UnhandleMessage('HACK_SELECT_AGENT', this.OnSelectAgent);
    UR.UnhandleMessage('HACK_DEBUG_MESSAGE', this.OnDebugMessage);
  }

  LoadModel(modelId) {
    // HACK
    // This requests model data from sim-data.
    // sim-data will respond with `HACK_SIMDATA_UPDATE_MODEL
    // which is handled by OnSimDataUpdate, below
    UR.RaiseMessage('HACK_SIMDATA_REQUEST_MODEL', { modelId });
  }

  OnSimDataUpdate(data) {
    const { scriptId } = this.state;
    this.setState({ model: data.model }, () => {
      if (scriptId) {
        this.OnSelectAgent(scriptId);
      }
    });
  }

  OnBackToModelClick() {
    const { modelId } = this.state;
    window.location = `/app/model?model=${modelId}`;
  }

  OnPanelClick(id) {
    if (id === 'sim') return; // don't do anything if user clicks on sim panel
    this.setState({
      panelConfiguration: id
    });
  }

  OnSelectAgent(scriptId) {
    const { model } = this.state;
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
    this.setState({
      panelConfiguration: 'script',
      script
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
          <button type="button" onClick={this.OnBackToModelClick}>
            Back to MODEL
          </button>
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
            <PanelInspector isActive />
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
