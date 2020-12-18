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

/// TESTS /////////////////////////////////////////////////////////////////////
// import 'modules/tests/test-parser'; // test parser evaluation

// this is where classes.* for css are defined
import { useStylesHOC } from './elements/page-xui-styles';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SCRIPTEDITOR');
const DBG = true;

/// PANEL CONFIGURATIONS //////////////////////////////////////////////////////
const PANEL_CONFIG = new Map();
PANEL_CONFIG.set('select', '50% auto 0px'); // columns
PANEL_CONFIG.set('script', '50% auto 0px'); // columns
PANEL_CONFIG.set('sim', '50% auto 0px'); // columns

/// DUMMY DATA ////////////////////////////////////////////////////////////////
///
/// This dummy code is passed to PanelScript when an agent is selected.
///
/// This should be loaded from the db
/// Hacked in for now
const agents = [
  { id: 'fish', label: 'Fish' },
  { id: 'algae', label: 'Algae' },
  { id: 'lightbeam', label: 'Lightbeam' },
  { id: 'poop', label: 'Poop', editor: 'UADDR01: Ben' }
];
const scripts = [
  {
    id: 'fish',
    script: `# BLUEPRINT Fish
# PROGRAM DEFINE
addProp frame Number 3
useFeature Movement
# PROGRAM UPDATE
setProp skin 'bunny.json'
featureCall Movement jitterPos -5 5
# PROGRAM EVENT
onEvent Tick [[
  // happens every second, and we check everyone
  ifExpr {{ agent.prop('name').value==='bun5' }} [[
    dbgOut 'my tick' 'agent instance' {{ agent.prop('name').value }}
    dbgOut 'my tock'
  ]]
  setProp 'x'  0
  setProp 'y'  0
]]
# PROGRAM CONDITION
when Bee sometest [[
  // dbgOut SingleTest
]]
when Bee sometest Bee [[
  // dbgOut PairTest
]]
`
  },
  {
    id: 'algae',
    script: `# BLUEPRINT Algae
# PROGRAM DEFINE
addProp frame Number 3
useFeature Movement
# PROGRAM UPDATE
setProp skin 'bunny.json'
featureCall Movement jitterPos -5 5
# PROGRAM EVENT
onEvent Tick [[
  // happens every second, and we check everyone
  ifExpr {{ agent.prop('name').value==='bun5' }} [[
    dbgOut 'my tick' 'agent instance' {{ agent.prop('name').value }}
    dbgOut 'my tock'
  ]]
  setProp 'x'  0
  setProp 'y'  0
]]
# PROGRAM CONDITION
`
  },
  {
    id: 'lightbeam',
    script: `# BLUEPRINT Lightbeam
# PROGRAM DEFINE
addProp frame Number 3
useFeature Movement
# PROGRAM UPDATE
setProp skin 'bunny.json'
featureCall Movement jitterPos -5 5
# PROGRAM EVENT
onEvent Tick [[
  // happens every second, and we check everyone
  ifExpr {{ agent.prop('name').value==='bun5' }} [[
    dbgOut 'my tick' 'agent instance' {{ agent.prop('name').value }}
    dbgOut 'my tock'
  ]]
  setProp 'x'  0
  setProp 'y'  0
]]
# PROGRAM CONDITION
`
  },
  { id: 'poop', script: '// nada' }
];

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class ScriptEditor extends React.Component {
  constructor() {
    super();
    this.state = {
      panelConfiguration: 'select'
    };
    // bind
    this.OnModelClick = this.OnModelClick.bind(this);
    this.OnPanelClick = this.OnPanelClick.bind(this);
    this.OnSelectAgent = this.OnSelectAgent.bind(this);
    // hooks
    // Sent by PanelSelectAgent
    UR.RegisterMessage('HACK_SELECT_AGENT', this.OnSelectAgent);
  }

  componentDidMount() {
    document.title = 'GEMSTEP SCRIPT EDITOR';
    // start URSYS
    UR.SystemConfig({ autoRun: true });
  }

  componentDidCatch(e) {
    console.log(e);
  }

  componentWillUnmount() {
    console.log('componentWillUnmount');
    UR.UnRegisterMessage('HACK_SELECT_AGENT', this.OnSelectAgent);
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

  OnSelectAgent(id) {
    console.log('OnSelectAgent', id);
    this.setState({
      panelConfiguration: 'script',
      // HACK: This should be retrieving the script from the server
      script: scripts.find(s => s.id === id).script
    });
  }

  /*  Renders 2-col, 3-row grid with TOP and BOTTOM spanning both columns.
   *  The base styles from page-styles are overidden with inline styles to
   *  make this happen.
   */
  render() {
    const { panelConfiguration, script } = this.state;
    const { classes } = this.props;
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
            <span style={{ fontSize: '32px' }}>SCRIPT EDITOR</span> UGLY DEVELOPER
            MODE
          </div>
          <button type="button" onClick={this.OnModelClick}>
            MODEL
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
            <PanelInspector isActive />
            <PanelInspector />
            <PanelInspector />
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
export default withStyles(useStylesHOC)(ScriptEditor);
