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

const defaultText = `
defBlueprint Bunny
defProp spriteFrame GSNumber 100
defProp currentHealth GSNumber 100
defProp isALive GSBoolean true
useFeature Movement
randomPos -50 50
prop skin setTo 'bunny.json'
onCondition frame 'jitterPos'
endBlueprint
`.trim();

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class Compiler extends React.Component {
  constructor() {
    super();
    this.text = defaultText;
    this.source = KeywordFactory.TokenizeToSource(this.text);
    this.state = {
      jsx: KeywordFactory.RenderSource(this.source),
      text: defaultText,
      source: [],
      tabIndex: 1
    };
    // bind
    this.btnToJSX = this.btnToJSX.bind(this);
    this.btnUpdateText = this.btnUpdateText.bind(this);
    this.btnCompileBlueprint = this.btnCompileBlueprint.bind(this);
    this.btnCompileText = this.btnCompileText.bind(this);
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
    const text = evt.target.value;
    this.text = text;
    this.setState({ text }, () => console.log(this.text));
  }

  // handle the "tabs"
  selectTab(evt) {
    this.setState({ tabIndex: Number(evt.target.value) });
  }

  // compile source to jsx
  btnToJSX() {
    if (DBG) console.group(...PR('toReact'));
    // this.source = KeywordFactory.TokenizeToSource(this.state.text);
    const jsx = KeywordFactory.RenderSource(this.source);
    UR.RaiseMessage('SCRIPT_UI_RENDER', jsx);
    if (DBG) console.groupEnd();
  }

  // compile jsx back to source
  btnUpdateText() {
    if (DBG) console.group(...PR('toSource'));
    const text = KeywordFactory.DecompileSource(this.source);
    this.setState({ text });
    this.text = text;
    if (DBG) console.groupEnd();
  }

  // compile text to source
  btnCompileText() {
    // this.text isn't updated
    const source = KeywordFactory.TokenizeToSource(this.text);
    this.source = source;
    this.setState({ source: JSON.stringify(source) });
  }

  // compile source to smc
  btnCompileBlueprint() {
    if (DBG) console.group(...PR('toSMC'));
    // this.source = KeywordFactory.TokenizeToSource(this.state.text);
    const blueprint = KeywordFactory.CompileSource(this.source);
    const { init, conditions, defaults, define } = blueprint;
    if (DBG) console.groupEnd();
    let source = 'SMC: ';
    if (init.length) source += `instance: ${init.length}; `;
    if (define.length) source += `define: ${define.length}; `;
    if (defaults.length) source += `defaults: ${define.length}; `;
    if (conditions.length) source += `conditions: ${conditions.length};`;
    console.log(source);
    this.setState({ source });
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
          <h3>SCRIPT VIEW</h3>
          <textarea
            rows={20}
            style={{
              boxSizing: 'border-box',
              width: '100%'
            }}
            value={this.state.text}
            onChange={this.updateSourceText}
          />
          <button type="button" name="compileText" onClick={this.btnCompileText}>
            TextToSource
          </button>{' '}
          <button
            type="button"
            name="compileBlueprint"
            onClick={this.btnCompileBlueprint}
          >
            SourceToSMC
          </button>
        </div>
      );
    }
    if (index === 1) {
      tab = (
        <div id="script-wizard">
          <h3>WIZARD VIEW</h3>
          {this.state.jsx}
          <button type="button" name="updateText" onClick={this.btnUpdateText}>
            WizardToText
          </button>{' '}
          <button
            type="button"
            name="compileBlueprint"
            onClick={this.btnCompileBlueprint}
          >
            SourceToSMC
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
          <span style={{ fontSize: '32px' }}>COMPILER/TEST</span> UGLY DEVELOPER
          MODE
        </div>
        <div id="console-left" className={clsx(classes.cell, classes.left)}>
          <button
            style={{ border: '0px' }}
            disabled={index === 0}
            type="button"
            onClick={this.selectTab}
            value={0}
          >
            show script view
          </button>
          <button
            style={{ border: '0px' }}
            disabled={index === 1}
            type="button"
            onClick={this.selectTab}
            value={1}
          >
            show wizard view
          </button>
          {tab}
          <hr />
          {this.state.source}
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
