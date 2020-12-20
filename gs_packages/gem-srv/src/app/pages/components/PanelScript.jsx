/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  PanelScript - Script Editing and Highlighting

  This uses `prism` to highlight gemscript.
  * We extend the javascript highlighting to add highlighting
    for gemscript keywords and data types.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import UR from '@gemstep/ursys/client';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
import * as SIM from 'modules/sim/api-sim'; // needed to register keywords for Prism
import * as DATACORE from 'modules/datacore';

/// CODE EDIT + HIGHLIGHTING //////////////////////////////////////////////////
import * as Prism from '../../../lib/vendor/prism_extended';
import { CodeJar } from '../../../lib/vendor/codejar';
import '../../../lib/vendor/prism_extended.css';

import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('PANELSCRIPT');
const DBG = true;

/// TEST SCRIPT ///////////////////////////////////////////////////////////////
/// These demo scripts are for testing the highlighting scheme only.
/// They're not currently being used.  Scripts are directly loaded via
/// props from ScriptEditor.

// Script text for testing Prism highlighting and scrolling
const highlighting_test_script = `# BLUEPRINT Bee
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

// EXTRA LONG SCRIPT TO TEST SCROLLING
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

// Working demoscript
const demoscript = `# BLUEPRINT BunBun
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

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class PanelScript extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Script'
      // script: demoscript // Replace the prop `script` with this to test
    };
    // codejar
    this.jarRef = React.createRef();
    this.jar = '';
    this.hackSendText = this.hackSendText.bind(this);

    // The keys map to token definitions in the prism css file.
    Prism.languages.gemscript = Prism.languages.extend('javascript', {
      'keyword': keywords_regex,
      'namespace': /^# \W*/gm, // multiline
      'inserted': types_regex
    });

    this.OnButtonClick = this.OnButtonClick.bind(this);
  }

  componentDidMount() {
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

  componentWillUnmount() {
    console.error(
      'PanelScript about to unmount.  We should save the script! (Not implemented yet)'
    );
  }

  hackSendText() {
    const text = this.jar.toString();
    UR.RaiseMessage('NET:HACK_RECEIVE_TEXT', { text });
  }

  OnButtonClick(action) {
    // This should save to URSYS
    // HACK now to go back to select screen
    // This calls the ScriptEditor onClick handler
    // to reconfigure the panels
    const { onClick } = this.props;
    onClick(action);
  }

  render() {
    const { title } = this.state;
    const { id, script, onClick, classes } = this.props;

    const BackBtn = (
      <button
        type="button"
        className={classes.button}
        style={{ alignSelf: 'flex-end' }}
        onClick={() => this.OnButtonClick('select')}
      >
        &lt; Select Script
      </button>
    );

    const SaveBtn = (
      <button
        type="button"
        className={classes.button}
        style={{ alignSelf: 'flex-end' }}
        onClick={() => this.hackSendText()}
      >
        SAVE TO SERVER
      </button>
    );

    const BottomBar = (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}
      >
        {BackBtn}
        {SaveBtn}
      </div>
    );

    return (
      <PanelChrome
        id={id} // used by click handler to identify panel
        title={title}
        onClick={onClick}
        bottombar={BottomBar}
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
