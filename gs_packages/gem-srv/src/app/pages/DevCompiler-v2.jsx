/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Compiler - Script Parsing and Compiling

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import UR from '@gemstep/ursys/client';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
import * as SIM from '../../modules/sim/api-sim';
import * as GLOBAL from '../../modules/datacore/dc-globals';
import * as DATACORE from '../../modules/datacore';
import * as RENDERER from '../../modules/render/api-render';
import * as TRANSPILER from '../../modules/sim/script/transpiler-v2';
import * as Prism from '../../lib/vendor/prism';
import { CodeJar } from '../../lib/vendor/codejar';
import '../../lib/vendor/prism.css';

// this is where classes.* for css are defined
import { useStylesHOC } from './elements/page-styles';

/// RUN TESTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see SystemInit.jsx for the test loader

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('COMP-V2');
const DBG = false;

/// HARDCODED SCRIPT TEXT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const defaultText = DATACORE.GetDefaultText();

/// URSYS SYSHOOKS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HookPhase(
  'UR/LOAD_ASSETS',
  () =>
    new Promise((resolve, reject) => {
      if (DBG) console.log(...PR('LOADING ASSET MANIFEST @ UR/LOAD_ASSETS...'));
      (async () => {
        let map = await GLOBAL.LoadAssetsSync('static/assets.json');
        if (DBG) console.log(...PR('ASSETS LOADED'));
        console.log(...PR('Waiting for user input'));
        // SIM.Start();
        // if (DBG) console.log(...PR('SIMULATION STARTED'));
        resolve();
      })();
    })
);

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class Compiler extends React.Component {
  constructor() {
    super();
    this.text = defaultText.trim();
    this.source = [];
    const jsx = TRANSPILER.RenderScript(this.source);
    this.state = {
      jsx,
      text: this.text,
      source: '',
      tabIndex: 0
    };
    // bind
    this.userToJSX = this.userToJSX.bind(this);
    this.userUpdateText = this.userUpdateText.bind(this);
    this.userSaveBlueprint = this.userSaveBlueprint.bind(this);
    this.userCompileText = this.userCompileText.bind(this);
    this.updateJSX = this.updateJSX.bind(this);
    this.updateScript = this.updateScript.bind(this);
    this.updateText = this.updateText.bind(this);
    this.updateTabSelect = this.updateTabSelect.bind(this);
    // hooks
    UR.HandleMessage('SCRIPT_JSX_CHANGED', this.updateJSX);
    UR.HandleMessage('SCRIPT_SRC_CHANGED', this.updateScript);
    // temp: make sure the blueprint
    // eventually this needs to be part of application startup
    const bdl = TRANSPILER.CompileBlueprint(this.source);
    TRANSPILER.RegisterBlueprint(bdl);
    // codejar
    this.jarRef = React.createRef();
    this.jar = '';
  }

  componentDidMount() {
    document.title = 'COMPILER';
    // start URSYS
    UR.SystemAppConfig({ autoRun: true });
    // initialize renderer
    const renderRoot = document.getElementById('root-renderer');
    RENDERER.SetGlobalConfig({ actable: true });
    RENDERER.Init(renderRoot);
    RENDERER.HookResize(window);
    // initialize codejar
    const highlight = editor => {
      Prism.highlightElement(editor);
    };
    const editor = this.jarRef.current;
    this.jar = CodeJar(editor, highlight);
    this.jar.onUpdate(code => {
      this.text = code;
    });
  }

  componentDidCatch(e) {
    console.log(e);
  }

  componentWillUnmount() {
    console.log('componentWillUnmount');
    UR.UnhandleMessage('SCRIPT_JSX_CHANGED', this.updateJSX);
    UR.UnhandleMessage('SCRIPT_SRC_CHANGED', this.updateScript);
  }

  // called by ScriptWizard component change
  updateScript(updata) {
    const { index, scriptUnit } = updata;
    this.source[index] = scriptUnit;
    console.log(...PR(`SCRIPT[${index}] updated:`, this.source[index]));
  }

  // called by message 'SCRIPT_JSX_CHANGED'
  updateJSX(jsx) {
    this.setState({ jsx });
  }

  // echo typing in ScriptText to state
  updateText(evt) {
    const text = evt.target.value;
    this.text = text;
    this.setState({ text });
  }

  // handle the "tabs"
  updateTabSelect(evt) {
    this.setState({ tabIndex: Number(evt.target.value) });
  }

  // compile source to jsx
  userToJSX() {
    if (DBG) console.group(...PR('toReact'));
    // this.source = TRANSPILER.ScriptifyText(this.state.text);
    const jsx = TRANSPILER.RenderScript(this.source);
    this.setState({ jsx });
    if (DBG) console.groupEnd();
  }

  // compile jsx back to source
  userUpdateText() {
    if (DBG) console.group(...PR('toSource'));
    const text = TRANSPILER.TextToScript(this.source);
    this.setState({ text });
    this.text = text;
    if (DBG) console.groupEnd();
  }

  // compile text to source
  userCompileText() {
    DATACORE.DeleteAllTests();
    const source = TRANSPILER.TextToScript(this.text);
    this.source = source;
    console.groupCollapsed('parsed text');
    TRANSPILER.ScriptToConsole(source);
    console.groupEnd();
    this.setState({ source: JSON.stringify(source) });
  }

  // compile source to smc
  userSaveBlueprint() {
    this.userCompileText();
    // save the blueprint to default and reprogram sim
    DATACORE.DeleteAllTests();
    // DATACORE.DeleteAllGlobalConditions(); // deprecated in script-xp
    DATACORE.DeleteAllScriptEvents();
    DATACORE.DeleteAllAgents();
    DATACORE.DeleteAllInstances();
    const bdl = TRANSPILER.CompileBlueprint(this.source);
    const bp = TRANSPILER.RegisterBlueprint(bdl);
    UR.RaiseMessage('AGENT_PROGRAM', bp.name);
    // update local jsx render
    const jsx = TRANSPILER.RenderScript(this.source);
    this.setState({ jsx });
    SIM.Start();
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
          <pre
            className="line-numbers"
            style={{ fontSize: '10px', lineHeight: 1, whiteSpace: 'pre-line' }}
          >
            <code id="codejar" ref={this.jarRef}>
              {this.state.text}
            </code>
          </pre>
          {/*
          <textarea
            rows={20}
            style={{
              boxSizing: 'border-box',
              width: '100%'
            }}
            value={this.state.text}
            onChange={this.updateText}
          /> */}
          <button
            type="button"
            name="saveBlueprint"
            onClick={this.userSaveBlueprint}
          >
            Save Blueprint
          </button>
        </div>
      );
    }
    if (index === 1) {
      tab = (
        <div id="script-wizard">
          <h3>WIZARD VIEW</h3>
          {this.state.jsx}
          <hr />
          <button type="button" name="updateText" onClick={this.userUpdateText}>
            Update Blueprint
          </button>
        </div>
      );
    }
    //
    return (
      <div
        className={classes.root}
        style={{ gridTemplateColumns: '30% auto 0px' }}
      >
        <div
          id="console-top"
          className={clsx(classes.cell, classes.top, classes.devBG)}
          style={{ gridColumnEnd: 'span 3' }}
        >
          <span style={{ fontSize: '32px' }}>DEV/COMPILER</span>{' '}
          {UR.ConnectionString()}
        </div>
        <div id="console-left" className={clsx(classes.cell, classes.left)}>
          <button
            style={{ border: '0px' }}
            disabled={index === 0}
            type="button"
            onClick={this.updateTabSelect}
            value={0}
          >
            script view
          </button>
          <button
            style={{ border: '0px' }}
            disabled={index === 1}
            type="button"
            onClick={this.updateTabSelect}
            value={1}
          >
            wizard view
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
          style={{ gridColumnEnd: 'span 3' }}
        >
          console-bottom
        </div>
      </div>
    );
  }
}
/// PHASE MACHINE INTERFACE ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HandleMessage('NET:GEM_COMPILERAPP', data => {
  return data || { nodata: true };
});

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStylesHOC)(Compiler);
