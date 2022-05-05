/* eslint-disable prefer-template */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  PanelScript - Script Editing and Highlighting

  This uses `prism` to highlight gemscript.
  * We extend the javascript highlighting to add highlighting
    for gemscript keywords and data types.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { withStyles } from '@material-ui/core/styles';
import UR from '@gemstep/ursys/client';
import {
  ScriptToJSX,
  UpdateScript
} from 'modules/sim/script/tools/script-to-jsx';
import { GetAllKeywords } from 'modules/datacore';
import { CompileToJSX } from '../helpers/mod-panel-script';

// Force load sim-features so that Features will be registered
// And we can read their properties
import 'modules/sim/sim-features';

/// CODE EDIT + HIGHLIGHTING //////////////////////////////////////////////////
import * as Prism from '../../../lib/vendor/prism_extended';
import { CodeJar } from '../../../lib/vendor/codejar';
import '../../../lib/vendor/prism_extended.css';
import '../../../lib/css/prism_linehighlight.css'; // override TomorrowNight

import DialogConfirm from './DialogConfirm';

import { useStylesHOC } from '../helpers/page-xui-styles';

import PanelChrome from './PanelChrome';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('PANELSCRIPT');
const DBG = false;
let needsSyntaxReHighlight = false;

const StyledToggleButton = withStyles(theme => ({
  root: {
    color: 'rgba(0,156,156,1)',
    backgroundColor: 'rgba(60,256,256,0.1)',
    '&:hover': {
      color: 'black',
      backgroundColor: '#6effff'
    },
    '&.Mui-selected': {
      color: '#6effff',
      backgroundColor: 'rgba(60,256,256,0.3)',
      '&:hover': {
        color: 'black',
        backgroundColor: '#6effff'
      }
    }
  }
}))(ToggleButton);

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
const keywords = GetAllKeywords();
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
      viewMode: 'code',
      jsx: '',
      lineHighlight: undefined,
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
    this.HandleScriptIsDirty = this.HandleScriptIsDirty.bind(this);
    this.GetTitle = this.GetTitle.bind(this);
    this.HandleScriptUIChanged = this.HandleScriptUIChanged.bind(this);
    this.SendText = this.SendText.bind(this);
    this.OnSelectScriptClick = this.OnSelectScriptClick.bind(this);
    this.HighlightDebugLine = this.HighlightDebugLine.bind(this);
    this.OnDelete = this.OnDelete.bind(this);
    this.OnDeleteConfirm = this.OnDeleteConfirm.bind(this);
    this.OnUnloadConfirm = this.OnUnloadConfirm.bind(this);
    this.OnToggleWizard = this.OnToggleWizard.bind(this);

    UR.HandleMessage('NET:UPDATE_MODEL', this.HandleSimDataUpdate);
    UR.HandleMessage('SCRIPT_IS_DIRTY', this.HandleScriptIsDirty);
    UR.HandleMessage('SCRIPT_UI_CHANGED', this.HandleScriptUIChanged);
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
    UR.UnhandleMessage('NET:UPDATE_MODEL', this.HandleSimDataUpdate);
    UR.UnhandleMessage('SCRIPT_IS_DIRTY', this.HandleScriptIsDirty);
    UR.UnhandleMessage('SCRIPT_UI_CHANGED', this.HandleScriptUIChanged);
    UR.UnhandleMessage('HACK_DEBUG_MESSAGE', this.HighlightDebugLine);
  }

  HandleSimDataUpdate() {
    needsSyntaxReHighlight = true;
  }

  HandleScriptIsDirty() {
    this.setState({ isDirty: true });
  }

  GetTitle(blueprintName) {
    return `Script: ${blueprintName}`;
  }

  /**
   * keyword editor has sent updated script line
   * update codejar text
   * @param {Object} data { index, scriptUnit, exitEdit }
   */
  HandleScriptUIChanged(data) {
    // 1. Convert script text to script units
    const currentScript = this.jar.toString();
    const updatedScript = UpdateScript(currentScript, data);

    // WORKING VERSION
    // const origScriptUnits = TRANSPILER.TextToScript(currentScript);

    // // 2. Figure out which unit to replace
    // const line = data.index;
    // const parentLine = data.parentIndices;
    // let scriptUnits = [...origScriptUnits];
    // console.log('scriptUnits (should be same as prev)', scriptUnits);
    // if (parentLine !== undefined) {
    //   // Update is a nested line, replace the block
    //   console.log('updating nested line');
    //   const blockPosition = data.blockIndex; // could be first block or second block <conseq> <alt>
    //   console.error('block is', blockPosition);
    //   const origBlock = scriptUnits[parentLine][blockPosition];
    //   console.log('...origBlock', origBlock);
    //   console.log('...line', line);
    //   const origBlockData = origBlock.block;
    //   origBlockData.splice(line, 1, ...data.scriptUnit);
    //   console.log('...updatedBlockData', origBlockData);
    //   scriptUnits[parentLine][blockPosition] = {
    //     block: origBlockData
    //   };
    // } else {
    //   // Update root level line
    //   scriptUnits[line] = data.scriptUnit;
    // }
    // console.log('updated ScriptUnits', scriptUnits, scriptUnits[1]);

    // // 3. Convert back to script text
    // const updatedScript = TRANSPILER.ScriptToText(scriptUnits);
    // console.log('updated script text', updatedScript);

    // END WORKING VERSION

    // ORIG
    // const currentScript = this.jar.toString();
    // // 1. Convert script text to array
    // const scriptTextLines = currentScript.split('\n');
    // // 2. Conver the updated line to text
    // const updatedLineText = TRANSPILER.ScriptToText(
    //   data.scriptUnit
    // );
    // // 3. Replace the updated line in the script array
    // scriptTextLines[data.index] = updatedLineText;
    // // 4. Convert the script array back to script text
    // const updatedScript = scriptTextLines.join('\n');

    // 5. Update the codejar code
    this.jar.updateCode(updatedScript);
    this.setState({ isDirty: true });
  }

  /**
   * 1. PanelScript raises NET:SCRIPT_UPDATE
   * 2. project-server handles NET:SCRIPT_UPDATE
   *    a. ScriptUpdate updates main data
   *    b. ScirptUpdate raises NET:UPDATE_MODEL
   * 3. MissionControl handles NET_UPDATE_MODEL
   *    a. OnSimDataUpdate calls CallSimPlaces
   *    b. CallSimPlaces raises *:SIM_PLACES
   * 2. PanelSimulation handles *:SIM_PLACES
   *    b. DoSimPlaces scriptifys the text
   *    c. DoSimPlaces registers the new blueprint
   *       replacing any existing blueprint
   *    a. DoSimPlaces raises ALL_AGENTS_PROGRAM
   * 4. sim-agents handles ALL_AGENTS_PROGRAM
   *    a. AllAgentsProgramUpdate either
   *       -- updates any existing instances
   *       -- or creates a new instance if it doesn't exist by calling
   *          Transpiler.MakeAgent
   * 5. Transpiler.MakeAgent
   *    a. MakeAgent creates a new agent out of the instancedef
   *       retrieving the existing blueprint from datacore.
   *    b. MakeAgent saves the agent via dc-sim-agents.SaveAgent
   * 6. dc-sim-agents.SaveAgent
   *    a. SaveAgent saves it to the AGENTS map.
   *    b. SaveAgent saves agents by id, which comes from a counter
   */
  SendText() {
    const { projId, bpName } = this.props;
    const text = this.jar.toString();
    UR.CallMessage('NET:SCRIPT_UPDATE', {
      projId,
      script: text,
      origBlueprintName: bpName
    }).then(result => {
      const newBpName = result.bpName;
      this.setState({ isDirty: false });
      // select the new script
      UR.RaiseMessage('SELECT_SCRIPT', { bpName: newBpName });
    });
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
      UR.RaiseMessage('SELECT_SCRIPT', { bpName: undefined }); // go to selection screen
      UR.RaiseMessage('NET:BLUEPRINT_DELETE', {
        blueprintName: this.origBlueprintName
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

  OnToggleWizard(e, value) {
    console.log('clicked', value);
    if (value === null) return; // skip repeated clicks
    // const currentScript = this.jar.toString();
    // const jsx = CompileToJSX(currentScript);
    const jsx = (
      <p>Sri has diabled CompileToJSX() in PanelScript.OnToggleWizard()</p>
    );
    this.setState({ jsx, viewMode: value });
  }

  render() {
    if (DBG) console.log(...PR('render'));
    const {
      title,
      viewMode,
      jsx,
      lineHighlight,
      isDirty,
      openConfirmDelete,
      openConfirmUnload
    } = this.state;
    const { id, bpName, script, projId, onClick, classes } = this.props;

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

    const updatedTitle = this.GetTitle(bpName);

    // TOP BAR ----------------------------------------------------------------
    const TopBar = (
      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={this.OnToggleWizard}
      >
        <StyledToggleButton value="code">Code</StyledToggleButton>
        <StyledToggleButton value="wizard">Wizard</StyledToggleButton>
      </ToggleButtonGroup>
    );

    // BOTTOM BAR ----------------------------------------------------
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
        message={`Are you sure you want to delete the "${bpName}" script?`}
        yesMessage={`Delete ${bpName}`}
        onClose={this.OnDeleteConfirm}
      />
    );
    const DialogConfirmUnload = (
      <DialogConfirm
        open={openConfirmUnload}
        message={`Are you sure you want to leave without saving the "${bpName}" script?`}
        yesMessage={`Leave ${bpName} without saving`}
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

    // CODE -------------------------------------------------------------------
    const Code = (
      <pre
        className="language-gemscript line-numbers match-braces"
        data-line={lineHighlight}
        style={{
          fontSize: '10px',
          lineHeight: 1,
          whiteSpace: 'pre-line',
          display: `${viewMode === 'code' ? 'inherit' : 'none'}`
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
    );

    // WIZARD -----------------------------------------------------------------
    const Wizard = (
      <div
        style={{
          display: `${viewMode === 'wizard' ? 'flex' : 'none'}`,
          flexDirection: 'column',
          width: '100%'
        }}
      >
        {jsx}
      </div>
    );

    // RETURN -----------------------------------------------------------------
    return (
      <PanelChrome
        id={id} // used by click handler to identify panel
        title={updatedTitle}
        onClick={onClick}
        topbar={TopBar}
        bottombar={BottomBar}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%'
          }}
        >
          {Code}
          {Wizard}
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
