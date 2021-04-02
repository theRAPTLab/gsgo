/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  PanelScript - Script Editing and Highlighting

  This uses `prism` to highlight gemscript.
  * We extend the javascript highlighting to add highlighting
    for gemscript keywords and data types.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import UR from '@gemstep/ursys/client';
import * as TRANSPILER from 'script/transpiler';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
import * as SIM from 'modules/sim/api-sim'; // needed to register keywords for Prism
import * as DATACORE from 'modules/datacore';

/// CODE EDIT + HIGHLIGHTING //////////////////////////////////////////////////
import * as Prism from '../../../lib/vendor/prism_extended';
import { CodeJar } from '../../../lib/vendor/codejar';
import '../../../lib/vendor/prism_extended.css';
import '../../../lib/css/prism_linehighlight.css'; // override TomorrowNight

import DialogConfirm from './DialogConfirm';

import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('PANELSCRIPT');
const DBG = true;
let needsSyntaxReHighlight = false;

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
  ifExpr {{ agent.getProp('name').value==='bun5' }} [[
    dbgOut 'my tick' 'agent instance' {{ agent.getProp('name').value }}
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
  ifExpr {{ agent.getProp('name').value==='bun5' }} [[
    dbgOut 'my tick' 'agent instance' {{ agent.getProp('name').value }}
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
  ifExpr {{ agent.getProp('name').value==='bun5' }} [[
    dbgOut 'my tick' 'agent instance' {{ agent.getProp('name').value }}
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
if (DBG) console.log(...PR('PRISM gemscript keywords', keywords_regex));

const types = ['Number', 'String', 'Boolean'];
const types_regex = new RegExp(
  '\\b(' + types.reduce((acc, cur) => `${acc}|${cur}`) + ')\\b'
);
if (DBG) console.log(...PR('PRISM gemscript types', types_regex));

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class PanelScript extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Script',
      lineHighlight: undefined,
      origBlueprintName: '',
      openConfirmDelete: false,
      isDirty: false,
      openConfirmUnload: false,
      confirmUnloadCallback: {} // fn called when user confirms unload
      // script: demoscript // Replace the prop `script` with this to test scripts defined in this file
    };
    // codejar
    this.jarRef = React.createRef();
    this.jar = '';

    // The keys (keyword, namespace, inserted)  map to token definitions in the prism css file.
    Prism.languages.gemscript = Prism.languages.extend('javascript', {
      'keyword': keywords_regex,
      'namespace': /^# \W*/gm, // multiline
      'inserted': types_regex
    });

    this.HandleSimDataUpdate = this.HandleSimDataUpdate.bind(this);
    this.UpdateBlueprintName = this.UpdateBlueprintName.bind(this);
    this.GetTitle = this.GetTitle.bind(this);
    this.SendText = this.SendText.bind(this);
    this.OnSelectScriptClick = this.OnSelectScriptClick.bind(this);
    this.HighlightDebugLine = this.HighlightDebugLine.bind(this);
    this.OnDelete = this.OnDelete.bind(this);
    this.OnDeleteConfirm = this.OnDeleteConfirm.bind(this);
    this.OnUnloadConfirm = this.OnUnloadConfirm.bind(this);

    UR.HandleMessage('NET:UPDATE_MODEL', this.HandleSimDataUpdate);
    UR.HandleMessage('HACK_DEBUG_MESSAGE', this.HighlightDebugLine);
  }

  componentDidMount() {
    if (DBG) console.log(...PR('componentDidMount'));
    // initialize codejar
    const highlight = editor => {
      Prism.highlightElement(editor);
    };
    const editor = this.jarRef.current;
    this.jar = CodeJar(editor, highlight);
    this.jar.onUpdate(code => {
      this.text = code;
      this.setState({ isDirty: true });
    });
    // Read original blueprint name
    // We need to save this in case the user changes the name
    // If the name is changed we have to clean up the old instances
    const { script } = this.props;
    this.UpdateBlueprintName(script);

    window.addEventListener('beforeunload', e => {
      const { isDirty } = this.state;
      if (isDirty) {
        // Show "Leave site?" dialog
        e.preventDefault();
        e.returnValue = ''; // required by Chrome
      }
    });
  }

  componentWillUnmount() {
    console.warn(
      'PanelScript about to unmount.  We should save the script! (Not implemented yet)'
    );
    UR.UnhandleMessage('HACK_DEBUG_MESSAGE', this.HighlightDebugLine);
  }

  HandleSimDataUpdate() {
    needsSyntaxReHighlight = true;
  }

  UpdateBlueprintName(script) {
    const blueprintName = TRANSPILER.ExtractBlueprintName(script);
    this.setState({
      title: this.GetTitle(blueprintName),
      origBlueprintName: blueprintName
    });
  }

  GetTitle(blueprintName) {
    return `Script: ${blueprintName}`;
  }

  /**
   * 1. PanelScript raises NET:SCRIPT_UPDATE
   * 2. project-data handles NET:SCRIPT_UPDATE
   *    a. ScriptUpdate updates main data
   *    b. ScirptUpdate raises NET:UPDATE_MODEL
   * 3. MissionControl handles NET_UPDATE_MODEL
   *    a. OnSimDataUpdate calls CallSimPlaces
   *    b. CallSimPlaces raises *:SIM_PLACES
   * 2. PanelSimulation handles *:SIM_PLACES
   *    b. DoSimPlaces scriptifys the text
   *    c. DoSimPlaces registers the new blueprint
   *       replacing any existing blueprint
   *    a. DoSimPlaces raises ALL_AGENTS_PROGRAM_UPDATE
   *    b. DoSimPlaces raises AGENTS_RENDER
   * 4. sim-agents handles ALL_AGENTS_PROGRAM_UPDATE
   *    a. AllAgentsProgramUpdate either
   *       -- updates any existing instances
   *       -- or creates a new instance if it doesn't exist by calling
   *          Transpiler.MakeAgent
   * 5. Transpiler.MakeAgent
   *    a. MakeAgent creates a new agent out of the instancedef
   *       retrieving the existing blueprint from datacore.
   *    b. MakeAgent saves the agent via dc-agents.SaveAgent
   * 6. dc-agents.SaveAgent
   *    a. SaveAgent saves it to the AGENTS map.
   *    b. SaveAgent saves agents by id, which comes from a counter
   */
  SendText() {
    const { origBlueprintName } = this.state;
    const text = this.jar.toString();
    const currentBlueprintName = TRANSPILER.ExtractBlueprintName(text);
    UR.RaiseMessage('NET:SCRIPT_UPDATE', {
      script: text,
      origBlueprintName
    });
    this.setState({ origBlueprintName: currentBlueprintName, isDirty: false });
    // select the new script
    if (origBlueprintName !== currentBlueprintName) {
      UR.RaiseMessage('SELECT_SCRIPT', { scriptId: currentBlueprintName });
    }
  }

  OnSelectScriptClick(action) {
    // Go back to select screen
    // This calls the ScriptEditor onClick handler
    // to reconfigure the panels
    const { isDirty } = this.state;
    const { onClick } = this.props;
    if (isDirty) {
      this.setState({
        openConfirmUnload: true,
        confirmUnloadCallback: () => onClick(action)
      });
    } else {
      onClick(action);
    }
  }

  HighlightDebugLine(data) {
    console.log('highlighting', data);
    this.setState(
      {
        lineHighlight: data.line
      },
      () => {
        // Force Prism update otherwise line number highlight is not updated
        Prism.highlightElement(this.jarRef.current);
      }
    );
  }

  OnDelete() {
    this.setState({
      openConfirmDelete: true
    });
  }

  OnDeleteConfirm(yesDelete) {
    this.setState({
      openConfirmDelete: false
    });
    if (yesDelete) {
      const { origBlueprintName } = this.state;
      UR.RaiseMessage('SELECT_SCRIPT', { scriptId: undefined }); // go to selection screen
      UR.RaiseMessage('NET:BLUEPRINT_DELETE', {
        blueprintName: origBlueprintName
      });
    }
  }

  OnUnloadConfirm(yesLeave) {
    const { unloadEvent, confirmUnloadCallback } = this.state;
    console.log('unlaodevent is', unloadEvent);
    this.setState({
      openConfirmUnload: false
    });
    if (yesLeave) {
      console.log('trying to leave');
      confirmUnloadCallback();
    }
  }

  render() {
    if (DBG) console.log(...PR('render'));
    const {
      title,
      lineHighlight,
      isDirty,
      openConfirmDelete,
      openConfirmUnload
    } = this.state;
    const { id, script, modelId, onClick, classes } = this.props;

    // CodeJar Refresh
    //
    // CodeJar does syntax highlighting when
    // a. componentDidMount
    // b. on keyboard input
    //
    // State updates causes PanelScript to re-render.
    // Sending the script to the server causes state updates,
    // and PanelScript rerenders with the updated script
    // but codejar does not re-highlight the script because
    // neither componentDidMount or a keyboard input was
    // triggered. So the updated script remains
    // un-highlighted.
    //
    // * We could tell codejar to update with props.script,
    // e.g. `this.jar.updateCode(script);`
    // but that doesn't reflect the current state of the code.
    // What ends up happening is the code reverts to the
    // original source code, losing any changes the user
    // may have made.
    //
    // * We could force codejar to update with the current text
    // e.g. `if (this.jar.updateCode) this.jar.updateCode(this.jar.toString());`
    // but inspector updates cause PanelScript to re-render
    // with every tick, and the updateCode call resets the input
    // cursor
    //
    // * Update only after sending script
    if (needsSyntaxReHighlight) {
      if (this.jar.updateCode) this.jar.updateCode(this.jar.toString());
      needsSyntaxReHighlight = false;
    }

    const blueprintName = TRANSPILER.ExtractBlueprintName(script);
    const updatedTitle = this.GetTitle(blueprintName);

    const BackBtn = (
      <button
        type="button"
        className={classes.button}
        style={{ alignSelf: 'flex-end' }}
        onClick={() => this.OnSelectScriptClick('select')}
      >
        &lt; SELECT SCRIPT
      </button>
    );

    const DeleteBtn = (
      <button
        type="button"
        className={`${classes.colorData} ${classes.buttonLink}`}
        style={{ alignSelf: 'flex-middle', fontSize: '12px' }}
        onClick={this.OnDelete}
      >
        DELETE SCRIPT
      </button>
    );

    const SaveBtn = (
      <button
        type="button"
        className={classes.button}
        style={{ alignSelf: 'flex-end' }}
        onClick={() => this.SendText()}
        disabled={!isDirty}
      >
        SAVE TO SERVER
      </button>
    );

    const DialogConfirmDelete = (
      <DialogConfirm
        open={openConfirmDelete}
        message={`Are you sure you want to delete the "${blueprintName}" script?`}
        yesMessage={`Delete ${blueprintName}`}
        onClose={this.OnDeleteConfirm}
      />
    );

    const DialogConfirmUnload = (
      <DialogConfirm
        open={openConfirmUnload}
        message={`Are you sure you want to leave without saving the "${blueprintName}" script?`}
        yesMessage={`Leave ${blueprintName} without saving`}
        noMessage="Back to Edit"
        onClose={this.OnUnloadConfirm}
      />
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
        {DeleteBtn}
        {SaveBtn}
        {DialogConfirmDelete}
        {DialogConfirmUnload}
      </div>
    );

    return (
      <PanelChrome
        id={id} // used by click handler to identify panel
        title={updatedTitle}
        onClick={onClick}
        bottombar={BottomBar}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%'
          }}
        >
          <pre
            className="language-gemscript line-numbers match-braces"
            data-line={lineHighlight}
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

window.URDebugTest = () => {
  UR.RaiseMessage('HACK_DEBUG_MESSAGE', {
    message: 'ERROR: Your code sucks: lines 5-10',
    line: '5-10'
  });
};

export default withStyles(useStylesHOC)(PanelScript);
