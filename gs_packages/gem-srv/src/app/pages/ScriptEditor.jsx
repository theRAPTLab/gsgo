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

/// DUMMY DATA ////////////////////////////////////////////////////////////////
///
/// This dummy code is passed to PanelScript when an agent is selected.
///
/// This should be loaded from the db
/// Hacked in for now
const agents = [
  { id: 'bunny', label: 'Bunny' },
  { id: 'fish', label: 'Fish' },
  { id: 'algae', label: 'Algae' },
  { id: 'lightbeam', label: 'Lightbeam' },
  { id: 'poop', label: 'Poop', editor: 'UADDR01: Ben' }
];
const scripts = [
  {
    id: 'bunny',
    script: `# BLUEPRINT Bunny
# PROGRAM DEFINE
useFeature Costume
useFeature Movement
featureCall Costume setCostume 'bunny.json' 0
featureCall Movement setMovementType 'wander'
addProp foodLevel Number 10
# PROGRAM UPDATE
setProp skin 'bunny.json'
# PROGRAM THINK
// featureHook Costume thinkHook
# PROGRAM EVENT
onEvent Tick [[
  // foodLevel goes down every second
  propCall foodLevel sub 1
  dbgOut 'foodLevel' {{ agent.getProp('foodLevel').value }}
  // hungry -- get jittery
  ifExpr {{ agent.getProp('foodLevel').value < 5 }} [[
    featureCall Costume setPose 1
    featureCall Movement setMovementType 'jitter'
  ]]
  // dead -- stop moving
  ifExpr {{ agent.getProp('foodLevel').value < 1 }} [[
    featureCall Costume setPose 2
    featureCall Movement setMovementType 'static'
  ]]
]]
# PROGRAM CONDITION
when Bunny sometest [[
  // dbgOut SingleTest
]]
when Bunny sometest Bunny [[
  // dbgOut PairTest
]]`
  },
  {
    id: 'fish',
    script: `# BLUEPRINT Fish
# PROGRAM DEFINE
useFeature Costume
useFeature Movement
featureCall Costume setCostume 'fish.json' 0
featureCall Movement setMovementType 'wander' 1
// featureCall Movement setDirection 90
addProp energyLevel Number 20
# PROGRAM UPDATE
setProp skin 'fish.json'
# PROGRAM THINK
// featureHook Costume thinkHook
# PROGRAM EVENT
onEvent Tick [[
  // foodLevel goes down every second
  propCall energyLevel sub 1
  // dbgOut 'fish energyLevel' {{ agent.getProp('energyLevel').value }}
  // sated
  ifExpr {{ agent.getProp('energyLevel').value > 15 }} [[
    featureCall Costume setPose 0
    featureCall Movement setMovementType 'wander'
  ]]
  // hungry
  ifExpr {{ agent.getProp('energyLevel').value < 15 }} [[
    featureCall Costume setPose 1
    featureCall Movement setMovementType 'wander'
  ]]
  // dead
  ifExpr {{ agent.getProp('energyLevel').value < 0 }} [[
    featureCall Costume setPose 2
    featureCall Movement setMovementType 'float'
  ]]
]]
# PROGRAM CONDITION
when Fish touches Algae [[
  // dbgOut 'Touch!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'
  // dbgContext

  setProp energyLevel {{ Fish.prop.energyLevel.value + 1 }}

  // IDEAL CALL
  // When fish touches algae, food level goes up
  // propCall foodLevel inc 1
  // kill Algae
]]
`
  },
  {
    id: 'algae',
    script: `# BLUEPRINT Algae
# PROGRAM DEFINE
useFeature Costume
useFeature Movement
featureCall Costume setCostume 'algae.json' 0
// featureCall Movement setRandomStart
featureCall Movement setMovementType 'wander' 0.2
addProp energyLevel Number 50
# PROGRAM UPDATE
setProp skin 'algae.json'
# PROGRAM THINK
// featureHook Costume thinkHook
# PROGRAM EVENT
onEvent Tick [[
  // energyLevel goes down every second
  propCall energyLevel sub 1
  dbgOut 'algae energyLevel' {{ agent.getProp('energyLevel').value }}
]]
# PROGRAM CONDITION
// when Algae touches Lightbeam [[
//   // When algae touches lightbeam, energyLevel goes up
//   propCall energyLevel inc 1
//   ifExpr {{ agent.getProp('energyLevel').value > 5 }} [[
//     dbgOut 'spawn new algae'
//     propCall energyLevel setTo 1
//   ]]
// ]]
`
  },
  {
    id: 'lightbeam',
    script: `# BLUEPRINT Lightbeam
# PROGRAM DEFINE
useFeature Costume
useFeature Movement
featureCall Costume setCostume 'lightbeam.json' 0
setProp x -300
setProp y -300
# PROGRAM UPDATE
setProp skin 'lightbeam.json'
featureCall Movement jitterPos -5 5
// featureCall Movement setController user
# PROGRAM THINK
// featureHook Costume thinkHook
# PROGRAM EVENT
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
      panelConfiguration: 'select',
      message: '',
      messageIsError: false
    };
    // bind
    this.OnModelClick = this.OnModelClick.bind(this);
    this.OnPanelClick = this.OnPanelClick.bind(this);
    this.OnSelectAgent = this.OnSelectAgent.bind(this);
    this.OnDebugMessage = this.OnDebugMessage.bind(this);
    // hooks
    // Sent by PanelSelectAgent
    UR.RegisterMessage('HACK_SELECT_AGENT', this.OnSelectAgent);
    UR.RegisterMessage('HACK_DEBUG_MESSAGE', this.OnDebugMessage);
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
    UR.UnregisterMessage('HACK_SELECT_AGENT', this.OnSelectAgent);
    UR.UnregisterMessage('HACK_DEBUG_MESSAGE', this.OnDebugMessage);
  }

  OnModelClick() {
    window.location = '/app/model';
  }

  OnPanelClick(id) {
    console.log('click', id); // e, e.target, e.target.value);
    if (id === 'sim') return; // don't do anything if user clicks on sim panel
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
    const { panelConfiguration, script, message, messageIsError } = this.state;
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
