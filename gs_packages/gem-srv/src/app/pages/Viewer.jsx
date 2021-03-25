/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Viewer -- Passive observer view

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import UR from '@gemstep/ursys/client';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
import * as SIM from 'modules/sim/api-sim'; // needed to register keywords for Prism
import * as GLOBAL from 'modules/datacore/dc-globals';
import * as DATACORE from 'modules/datacore';

/// PANELS ////////////////////////////////////////////////////////////////////
import PanelSimViewer from './components/PanelSimViewer';
import PanelBlueprints from './components/PanelBlueprints';
import PanelInspector from './components/PanelInspector';
import PanelInstances from './components/PanelInstances';

/// TESTS /////////////////////////////////////////////////////////////////////
// import 'modules/tests/test-parser'; // test parser evaluation

// this is where classes.* for css are defined
import { useStylesHOC } from './elements/page-xui-styles';
import './scrollbar.css';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('VIEWER');
const DBG = true;

/// PANEL CONFIGURATIONS //////////////////////////////////////////////////////
const PANEL_CONFIG = new Map();
PANEL_CONFIG.set('instances', '15% auto 150px'); // columns
PANEL_CONFIG.set('sim', '110px auto 150px'); // columns

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class Viewer extends React.Component {
  constructor() {
    super();
    this.state = {
      panelConfiguration: 'sim',
      modelId: '',
      model: {},
      instances: []
    };
    this.HandleSimDataUpdate = this.HandleSimDataUpdate.bind(this);
    this.HandleInspectorUpdate = this.HandleInspectorUpdate.bind(this);
    this.OnModelClick = this.OnModelClick.bind(this);
    this.OnHomeClick = this.OnModelClick.bind(this);
    this.OnPanelClick = this.OnPanelClick.bind(this);
    UR.HandleMessage('NET:UPDATE_MODEL', this.HandleSimDataUpdate);
    UR.HandleMessage('NET:INSPECTOR_UPDATE', this.HandleInspectorUpdate);

    // System Hooks
    UR.HookPhase('SIM/STAGED', () => {
      // **************************************************
      // REVIEW
      // This assumes that MissionControl is already running.
      // This is not always reliable, especially during code
      // refresh.  This call might go out before MissionControl.
      // **************************************************
      UR.RaiseMessage('NET:REQUEST_CURRENT_MODEL');
    });
  }

  componentDidMount() {
    // start URSYS
    UR.SystemAppConfig({ autoRun: true });
  }

  componentDidCatch(e) {
    console.log(e);
  }

  componentWillUnmount() {
    UR.UnhandleMessage('NET:UPDATE_MODEL', this.HandleSimDataUpdate);
    UR.UnhandleMessage('NET:INSPECTOR_UPDATE', this.HandleInspectorUpdate);
  }

  HandleSimDataUpdate(data) {
    console.error('onsimupdate');
    this.setState({
      modelId: data.modelId,
      model: data.model,
      instances: data.instances
    });
    document.title = `VIEWER ${data.modelId}`;
  }

  HandleInspectorUpdate(data) {
    if (!data || data.agents === undefined) {
      console.error('OnInspectorUpdate got bad data', data);
      return;
    }
    this.setState({ instances: data.agents });
  }

  OnModelClick() {
    const { modelId } = this.state;
    window.location = `/app/model?${modelId}`;
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
    const { panelConfiguration, modelId, model, instances } = this.state;
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
            <span style={{ fontSize: '32px' }}>VIEWER {modelId}</span> UGLY
            DEVELOPER MODE
          </div>
          <Link
            to={{ pathname: `/app/model?model=${modelId}` }}
            className={classes.navButton}
          >
            Back to PROJECT
          </Link>
        </div>
        <div
          id="console-left"
          className={classes.left} // commented out b/c adding a padding
          style={{ backgroundColor: 'transparent' }}
        >
          <PanelBlueprints id="blueprints" modelId={modelId} agents={agents} />
          <PanelInstances id="instances" />
        </div>
        <div id="console-main" className={classes.main}>
          <PanelSimViewer id="sim" onClick={this.OnPanelClick} />
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
          console-bottom
        </div>
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStylesHOC)(Viewer);
