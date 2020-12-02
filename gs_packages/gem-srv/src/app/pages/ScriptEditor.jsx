/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Compiler - Script Parsing and Compiling

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import UR from '@gemstep/ursys/client';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
import * as GLOBAL from 'modules/runtime-globals';
import icon from './codicon.ttf';
import test from './test.css';
// import * as monaco from 'monaco-editor';

/// TESTS /////////////////////////////////////////////////////////////////////
// import 'modules/tests/test-parser'; // test parser evaluation

// this is where classes.* for css are defined
import { useStylesHOC } from './page-styles';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SCRIPTEDITOR');
const DBG = true;

/// HARCODED SOURCE ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const defaultText = `
// definitions
defBlueprint "Bunny"
addProp frame Number 2
useFeature Movement
// defaults
prop skin 'bunny.json'
// runtime
featureCall Movement jitterPos -5 5
// condition test 1
addTest BunnyTest {{ agent.prop('frame')._value }}
ifTest BunnyTest {{ agent.prop('x').setTo(global.LibMath.sin(global._frame()/10)*100) }}
// condition test 2
ifExpr {{ global.LibMath.random() < 0.01 }} {{ agent.prop('y').setTo(100) }} {{ agent.prop('y').setTo(0) }}
`.trim();

const defineGlobalAgent = `
defGlobalAgent World
  addProp time Number 10
  addProp daytime Boolean true
  // runtime
  // condition
  when Interval 1000
    prop time decrement
    defCondition "memo:switch"
    {{ prop time < 0 }}
    prop time setTo 10
    prop daytime invert
`.trim();

// try to make a fish!
/** fish just wander around the screen
 *
 */
const defineFish = `
// define/default program
defBlueprint Fish
addProp foodLevel Number 50
prop foodLevel setMin 0
prop foodLevel setMax 100
prop skin setTo 'alive.png'
useFeature Movement

featureProp inputType setTo 'runtime'
// runtime program (runs only for runtime mode?)
featureCall Movement randomWalk 15 2

// condition programs
// every second decrement foodlevel
when Interval 1000
  prop foodLevel increment
  defCondition "memo:dead"
    {{ prop foodLevel < 1 }}
    prop isActive false
    prop skin setTo "dead.png"
    featureProp inputType setTo 'static'
  defCondition "memo:worldtimer"
    globalAgentProp World daytime
    {{ globalAgentProp World daytime === true}}
    prop skin setTo "happy.png"
`.trim();

/// URSYS SYSHOOKS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.SystemHook(
  'UR/LOAD_ASSETS',
  () =>
    new Promise((resolve, reject) => {
      if (DBG) console.log(...PR('LOADING ASSET MANIFEST @ UR/LOAD_ASSETS...'));
      (async () => {
        let map = await GLOBAL.LoadAssets('static/assets.json');
        if (DBG) console.log(...PR('ASSETS LOADED'));
        // Compiler.jsx starts sim, but we shouldn't need to?
        // SIM.StartSimulation();
        // if (DBG) console.log(...PR('SIMULATION STARTED'));
      })();
      resolve();
    })
);

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class ScriptEditor extends React.Component {
  constructor() {
    super();
    // monaco.editor.create(document.getElementById('editor'), {
    //   value: ['function x() {', '\tconsole.log("Hello world!");', '}'].join('\n'),
    //   language: 'javascrpt'
    // });
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
  }

  // echo typing in SourceText to state
  updateText(evt) {
    const text = evt.target.value;
    this.text = text;
    this.setState({ text });
  }

  /*  Renders 2-col, 3-row grid with TOP and BOTTOM spanning both columns.
   *  The base styles from page-styles are overidden with inline styles to
   *  make this happen.
   */
  render() {
    const { classes } = this.props;
    return (
      <div
        className={classes.root}
        style={{ gridTemplateColumns: '30% auto 0px' }}
      >
        <div
          id="console-top"
          className={clsx(classes.cell, classes.top)}
          style={{ gridColumnEnd: 'span 3' }}
        >
          <span style={{ fontSize: '32px' }}>SCRIPT EDITOR</span> UGLY DEVELOPER
          MODE
        </div>
        <div id="console-left" className={clsx(classes.cell, classes.left)}>
          <div id="editor">code icon</div>
        </div>
        <div id="root-renderer" className={classes.main}>
          world view
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
