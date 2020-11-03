/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Compiler - Script Parsing and Compiling

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import UR from '@gemstep/ursys/client';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
import * as SIM from 'modules/sim/api-sim';
import * as DATACORE from 'modules/runtime-datacore';
import * as RENDERER from 'modules/render/api-render';
import { AgentFactory, KeywordFactory } from 'script/agent-factory';

// this is where classes.* for css are defined
import { useStylesHOC } from './page-styles';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('COMPILER', 'TagBlue');
const DBG = true;

/// URSYS SYSHOOKS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.SystemHook(
  'UR/LOAD_ASSETS',
  () =>
    new Promise((resolve, reject) => {
      if (DBG) console.log(...PR('LOADING ASSET MANIFEST @ UR/LOAD_ASSETS...'));
      (async () => {
        let map = await DATACORE.ASSETS_LoadManifest('static/assets.json');
        if (DBG) console.log(...PR('ASSETS LOADED'));
        SIM.StartSimulation();
        if (DBG) console.log(...PR('SIMULATION STARTED'));
      })();
      resolve();
    })
);

/// HARCODED SOURCE ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const defaultSource = `
defTemplate Bee
defProp nectarAmount GSNumber 0
useFeature FishCounter
useFeature BeanCounter
endTemplate
defTemplate HoneyBee Bee
defProp honeySacks GSNumber 0
endTemplate
`.trim();

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class Compiler extends React.Component {
  constructor() {
    super();
    // prep
    this.source = KeywordFactory.ScriptifyText(defaultSource);
    this.state = {
      jsx: KeywordFactory.RenderSource(this.source),
      source: defaultSource,
      tabIndex: 0
    };
    // bind
    this.btnToReact = this.btnToReact.bind(this);
    this.btnToSource = this.btnToSource.bind(this);
    this.btnToSMC = this.btnToSMC.bind(this);
    this.uiRenderScriptWizard = this.uiRenderScriptWizard.bind(this);
    this.uiScriptWizardChanged = this.uiScriptWizardChanged.bind(this);
    this.updateSourceText = this.updateSourceText.bind(this);
    this.selectTab = this.selectTab.bind(this);
    // hooks
    UR.RegisterMessage('SCRIPT_UI_RENDER', this.uiRenderScriptWizard);
    UR.RegisterMessage('SCRIPT_UI_CHANGED', this.uiScriptWizardChanged);
  }

  componentDidMount() {
    document.title = 'GEMSTEP';
    // start URSYS
    UR.SystemConfig({ autoRun: true });
    // initialize renderer
    const renderRoot = document.getElementById('root-renderer');
    RENDERER.SetGlobalConfig({ actable: true });
    RENDERER.Init(renderRoot);
    RENDERER.HookResize(window);
  }

  componentWillUnmount() {
    console.log('componentWillUnmount');
    UR.UnregisterMessage('SCRIPT_UI_RENDER', this.uiRenderScriptWizard);
    UR.RegisterMessage('SCRIPT_UI_CHANGED', this.uiScriptWizardChanged);
  }

  // called by ScriptWizard component change
  uiScriptWizardChanged(updata) {
    const { index, scriptUnit } = updata;
    this.source[index] = scriptUnit;
    console.log(...PR(`SOURCE[${index}] updated:`, this.source[index]));
  }

  // called by message 'SCRIPT_UI_RENDER'
  uiRenderScriptWizard(jsx) {
    this.setState({ jsx });
  }

  // echo typing in SourceText to state
  updateSourceText(evt) {
    this.setState({ source: evt.target.value });
  }

  // handle the "tabs"
  selectTab(evt) {
    this.setState({ tabIndex: Number(evt.target.value) });
  }

  // compile source to jsx
  btnToReact() {
    if (DBG) console.group(...PR('toReact'));
    this.source = KeywordFactory.ScriptifyText(this.state.source);
    const jsx = KeywordFactory.RenderSource(this.source);
    UR.RaiseMessage('SCRIPT_UI_RENDER', jsx);
    if (DBG) console.groupEnd();
  }

  // compile jsx back to source
  btnToSource() {
    if (DBG) console.group(...PR('toSource'));
    this.setState({ source: KeywordFactory.DecompileSource(this.source) });
    if (DBG) console.groupEnd();
  }

  // compile source to smc
  btnToSMC() {
    if (DBG) console.group(...PR('toSMC'));
    this.source = KeywordFactory.ScriptifyText(this.state.source);
    const template = KeywordFactory.CompileSource(this.source);
    const { init, conditions, defaults, define } = template;
    if (init.length) console.log(...PR('instance'), init);
    if (define.length) console.log(...PR('define'), define);
    if (defaults.length) console.log(...PR('defaults'), defaults);
    if (conditions.length) console.log(...PR('conditions'), conditions);
    if (DBG) console.groupEnd();
  }

  /*  Renders 2-col, 3-row grid with TOP and BOTTOM spanning both columns.
   *  The base styles from page-styles are overidden with inline styles to
   *  make this happen.
   */
  render() {
    const { classes } = this.props;
    const index = this.state.tabIndex;
    let tab = <p>unknown tab {index}</p>;
    if (index === 0) {
      tab = (
        <div id="script-text">
          <textarea
            rows={20}
            style={{ boxSizing: 'border-box', width: '100%' }}
            value={this.state.source}
            onChange={this.updateSourceText}
          />
          <button type="button" name="toReact" onClick={this.btnToReact}>
            Source To React
          </button>{' '}
          <button type="button" name="toSMC" onClick={this.btnToSMC}>
            Source To SMC
          </button>
        </div>
      );
    }
    if (index === 1) {
      tab = (
        <div id="script-wizard">
          <h3>SCRIPT WIZARD</h3>
          {this.state.jsx}
          <button type="button" name="toSource" onClick={this.btnToSource}>
            React to Source
          </button>
        </div>
      );
    }
    //
    return (
      <div className={classes.root} style={{ gridTemplateColumns: '25% 70%' }}>
        <div
          id="console-top"
          className={clsx(classes.cell, classes.top)}
          style={{ gridColumnEnd: 'span 2' }}
        >
          <span style={{ fontSize: '32px' }}>COMPILER/TEST</span>
        </div>
        <div id="console-left" className={clsx(classes.cell, classes.left)}>
          <button type="button" onClick={this.selectTab} value={0}>
            SOURCE
          </button>
          <button type="button" onClick={this.selectTab} value={1}>
            WIZARD
          </button>
          <h3>DEVELOPER SOURCE TESTER</h3>
          {tab}
        </div>
        <div id="root-renderer" className={classes.main}>
          world view
        </div>
        <div
          id="console-bottom"
          className={clsx(classes.cell, classes.bottom)}
          style={{ gridColumnEnd: 'span 2' }}
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
export default withStyles(useStylesHOC)(Compiler);
