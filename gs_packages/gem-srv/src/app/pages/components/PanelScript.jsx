import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import UR from '@gemstep/ursys/client';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
import * as SIM from 'modules/sim/api-sim'; // needed to register keywords for Prism
import * as GLOBAL from 'modules/datacore/dc-globals';
import * as DATACORE from 'modules/datacore';

/// CODE EDIT + HIGHLIGHTING //////////////////////////////////////////////////
import * as Prism from '../../../util/prism_extended';
import { CodeJar } from '../../../util/codejar';
import '../../../util/prism_extended.css';

import { useStylesHOC } from '../page-xui-styles';

import PanelChrome from './PanelChrome';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('PANELSCRIPT');
const DBG = true;

/// DEMO SCRIPT ///////////////////////////////////////////////////////////////
const demoscript = `# BLUEPRINT Bee
# DEFINE
addProp frame Number 3
useFeature Movement
# UPDATE
setProp skin 'bunny.json'
featureCall Movement jitterPos -5 5
# EVENT
onEvent Tick [[
  // happens every second, and we check everyone
  ifExpr {{ agent.prop('name').value==='bun5' }} [[
    dbgOut 'my tick' 'agent instance' {{ agent.prop('name').value }}
    dbgOut 'my tock'
  ]]
  setProp 'x'  0
  setProp 'y'  0
]]
# CONDITION
when Bee sometest [[
  // dbgOut SingleTest
]]
when Bee sometest Bee [[
  // dbgOut PairTest
]]

// Bad Matches
preaddProp
addPropPost
not a # pragma
addProp comment // comment after

// EXTRA LONG SCRIPT
# DEFINE
addProp frame Number 3
useFeature Movement
# UPDATE
setProp skin 'bunny.json'
featureCall Movement jitterPos -5 5
# EVENT
onEvent Tick [[
  // happens every second, and we check everyone
  ifExpr {{ agent.prop('name').value==='bun5' }} [[
    dbgOut 'my tick' 'agent instance' {{ agent.prop('name').value }}
    dbgOut 'my tock'
  ]]
  setProp 'x'  0
  setProp 'y'  0
]]
# CONDITION
when Bee sometest [[
  // dbgOut SingleTest
]]
when Bee sometest Bee [[
  // dbgOut PairTest
]]

`;

/// PRISM GEMSCRIPT DEFINITION ////////////////////////////////////////////////
const keywords = DATACORE.GetAllKeywords();
const keywords_regex = new RegExp(
  '\\b(' + keywords.reduce((acc, cur) => `${acc}|${cur}`) + ')\\b'
);
console.log('PRISM gemscript keywords', keywords_regex);

const types = ['Number', 'String', 'Boolean'];
const types_regex = new RegExp(
  '\\b(' + types.reduce((acc, cur) => `${acc}|${cur}`) + ')\\b'
);
console.log('PRISM gemscript types', types_regex);

/// URSYS SYSHOOKS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Is this necessary?  Causing async "Uncaught (in promise) undefined" error
// UR.SystemHook(
//   'UR/LOAD_ASSETS',
//   () =>
//     new Promise((resolve, reject) => {
//       if (DBG) console.log(...PR('LOADING ASSET MANIFEST @ UR/LOAD_ASSETS...'));
//       (async () => {
//         let map = await GLOBAL.LoadAssets('static/assets.json');
//         if (DBG) console.log(...PR('ASSETS LOADED'));
//         // Compiler.jsx starts sim, but we shouldn't need to?
//         // SIM.StartSimulation();
//         // if (DBG) console.log(...PR('SIMULATION STARTED'));
//       })();
//       resolve();
//     })
// );

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class PanelScript extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Script',
      script: demoscript
    };
    // codejar
    this.jarRef = React.createRef();
    this.jar = '';

    // The keys map to token definitions in the prism css file.
    Prism.languages.gemscript = Prism.languages.extend('javascript', {
      'keyword': keywords_regex,
      'namespace': /^# \W*/gm, // multiline
      'inserted': types_regex
    });

    this.OnSaveClick = this.OnSaveClick.bind(this);
  }

  componentDidMount() {
    // start URSYS
    UR.SystemConfig({ autoRun: true });
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

  OnSaveClick() {
    // This should save to URSYS
    // HACK now to go back to select screen
    const { onClick } = this.props;
    onClick('select');
  }

  render() {
    const { title, script } = this.state;
    const { id, onClick, classes } = this.props;

    const SaveBtn = (
      <button
        type="button"
        className={classes.button}
        style={{ alignSelf: 'flex-end' }}
        onClick={this.OnSaveClick}
      >
        SAVE TO SERVER
      </button>
    );

    return (
      <PanelChrome
        id={id} // used by click handler to identify panel
        title={title}
        onClick={onClick}
        bottombar={SaveBtn}
      >
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <pre
            className="language-gemscript line-numbers match-braces"
            style={{
              fontSize: '10px',
              lineHeight: 1,
              whiteSpace: 'pre-line'
            }}
          >
            <code
              id="codejar"
              ref={this.jarRef}
              style={{ width: '100%', height: 'auto' }}
            >
              {script}
            </code>
          </pre>
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelScript);
