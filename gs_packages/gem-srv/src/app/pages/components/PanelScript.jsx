/* eslint-disable prefer-template */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  PanelScript - Script Editing and Highlighting

  Shows:
  * Code Editor View
  * Script Page Wizard View

  MANAGING STATE

      PanelScript has to manage both the Code view and the ScriptViewPane
      Wizard view.  To do so, it listens to wizcore state updates and
      passes it on to the subcomponents, including ScriptViewPane.

      ScriptViewPane uses props to receive `script_page` for backward
      compatibility with DevWizard

  WIZARD VIEW

  CODE VIEW

      This uses `prism` to highlight gemscript.
      * We extend the javascript highlighting to add highlighting
        for gemscript keywords and data types.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import React from 'react';
import * as EDITMGR from 'modules/appcore/ac-editmgr';
import * as WIZCORE from 'modules/appcore/ac-wizcore';
import * as SLOTCORE from 'modules/appcore/ac-slotcore';

import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { withStyles } from '@material-ui/core/styles';
import { UpdateScript } from 'modules/sim/script/tools/script-to-jsx';
import { ScriptViewPane } from '../wiz/edit/ScriptViewPane';
import { GetAllKeywords } from 'modules/datacore';
import { SKIP_RELOAD_WARNING } from 'config/gem-settings';

// Force load sim-features so that Features will be registered
// And we can read their properties
import 'modules/sim/sim-features';

/// CODE EDIT + HIGHLIGHTING //////////////////////////////////////////////////
import * as Prism from 'lib/vendor/prism_extended';
import { CodeJar } from 'lib/vendor/codejar';
import 'lib/vendor/prism_extended.css';
import 'lib/css/prism_linehighlight.css'; // override TomorrowNight

import Dialog from './Dialog';

import { useStylesHOC } from '../helpers/page-xui-styles';

import PanelChrome from './PanelChrome';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('PANELSCRIPT');
const DBG = false;

const VIEWMODE_WIZARD = 'wizard';
const VIEWMODE_CODE = 'code';

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
    const { script_page, script_text, sel_linenum } = WIZCORE.State();
    this.state = {
      viewMode: VIEWMODE_WIZARD, // 'code',
      jsx: '',
      lineHighlight: undefined,
      openConfirmDelete: false,
      openConfirmUnload: false,
      confirmUnloadCallback: {}, // fn called when user confirms unload
      // script: demoscript // Replace the prop `script` with this to test scripts defined in this file
      // post wizcore integration
      script_page,
      script_text,
      sel_linenum
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

    this.handleWizUpdate = this.handleWizUpdate.bind(this);
    this.HandleSimDataUpdate = this.HandleSimDataUpdate.bind(this);
    this.GetTitle = this.GetTitle.bind(this);
    // DEPRECATED?  No one is Raising SCRIPT_UI_CHANGED at the moment?
    this.HandleScriptUIChanged = this.HandleScriptUIChanged.bind(this);
    this.SendText = this.SendText.bind(this);
    this.OnSelectScriptClick = this.OnSelectScriptClick.bind(this);
    this.HighlightDebugLine = this.HighlightDebugLine.bind(this);
    this.OnDelete = this.OnDelete.bind(this);
    this.OnDeleteConfirm = this.OnDeleteConfirm.bind(this);
    this.OnUnloadConfirm = this.OnUnloadConfirm.bind(this);
    this.OnToggleWizard = this.OnToggleWizard.bind(this);

    UR.HandleMessage('NET:UPDATE_MODEL', this.HandleSimDataUpdate);
    // DEPRECATED?  No one is Raising SCRIPT_UI_CHANGED at the moment?
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
      WIZCORE.SendState({ script_page_needs_saving: true });
    });

    // add a subscriber
    WIZCORE.SubscribeState(this.handleWizUpdate);

    window.addEventListener('beforeunload', e => {
      if (SKIP_RELOAD_WARNING) return;
      if (WIZCORE.State().script_page_needs_saving) {
        // Show "Leave site?" dialog
        e.preventDefault();
        e.returnValue = ''; // required by Chrome
        return e;
      }
    });
  }

  componentWillUnmount() {
    WIZCORE.UnsubscribeState(this.handleWizUpdate);
    UR.UnhandleMessage('NET:UPDATE_MODEL', this.HandleSimDataUpdate);
    UR.UnhandleMessage('SCRIPT_UI_CHANGED', this.HandleScriptUIChanged);
    UR.UnhandleMessage('HACK_DEBUG_MESSAGE', this.HighlightDebugLine);
  }

  /** INCOMING: handle WIZCORE event updates */
  handleWizUpdate(vmStateEvent) {
    // EASY VERSION REQUIRING CAREFUL WIZCORE CONTROL
    const { script_page, script_text, script_page_needs_saving, sel_linenum } =
      vmStateEvent;
    const newState = {};
    let cb;
    if (script_page) {
      newState.script_page = script_page;
    }
    if (script_text) {
      newState.script_text = script_text;
      cb = () => {
        this.jar.updateCode(script_text);
        // Force Prism update otherwise line number highlight is not updated
        Prism.highlightElement(this.jarRef.current);
      };
    }
    // REVIEW: This is not strictly necessary...just using this to trigger
    // ScriptViewPane redraw for now
    if (sel_linenum !== undefined) {
      newState.sel_linenum = sel_linenum;
    }
    // if script_page_needs_saving, the setState will trigger a rerender
    if (Object.keys(newState).length > 0 || script_page_needs_saving)
      this.setState(newState, cb);
  }

  HandleSimDataUpdate() {
    needsSyntaxReHighlight = true;
  }

  GetTitle(blueprintName) {
    return `Script: ${blueprintName}`;
  }

  /**
   * keyword editor has sent updated script line
   * update codejar text
   * @param {Object} data { index, scriptUnit, exitEdit }
   */
  // DEPRECATED?  No one is Raising SCRIPT_UI_CHANGED at the moment?
  HandleScriptUIChanged(data) {
    // 1. Convert script text to script units
    const currentScript = this.jar.toString();
    const updatedScript = UpdateScript(currentScript, data);

    // 5. Update the codejar code
    this.jar.updateCode(updatedScript);
    WIZCORE.SendState({ script_page_needs_saving: true });
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
  /// REVIEW: Shouldn't this be handled by Wizcore?
  SendText() {
    // abort if slots need saving
    // REVIEW: The more UI-friendly way to do this would probably
    //         be to use a custom dialog that allows you to both
    //         save the slot AND submit to server.
    const { slots_need_saving } = SLOTCORE.State();
    if (slots_need_saving) {
      SLOTCORE.SendState({ slots_save_dialog_is_open: true });
      return;
    }

    const { viewMode } = this.state;
    const { projId, bpName } = this.props;
    let text;
    // if we're in code view, send the code script
    if (viewMode === VIEWMODE_CODE) {
      text = this.jar.toString();
      WIZCORE.SendState({ script_text: text });
    } else {
      // wizard data
      text = WIZCORE.State().script_text;
    }
    UR.CallMessage('NET:SCRIPT_UPDATE', {
      projId,
      script: text,
      origBlueprintName: bpName
    }).then(result => {
      const newBpName = result.bpName;
      WIZCORE.SendState({ script_page_needs_saving: false });

      // select the new script otherwise wizard retains the old script
      UR.RaiseMessage('SELECT_SCRIPT', { bpName: newBpName });
    });
  }

  OnSelectScriptClick(action) {
    // Go back to select screen
    // This calls the ScriptEditor onClick handler
    // to reconfigure the panels
    const { onClick } = this.props;
    if (WIZCORE.State().script_page_needs_saving) {
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
    if (value === null) return; // skip repeated clicks
    if (value === VIEWMODE_CODE) {
      // currently wizard, clicked on code
      // we don't need to do a data update because wizard keeps state updated
      // but we do need to unselect slot editor
      EDITMGR.CancelSlotEdit();
    } else if (value === VIEWMODE_WIZARD) {
      const script_text = this.jar.toString();
      WIZCORE.SendState({ script_text });
    }
    this.setState({ viewMode: value }, () => {
      // Force Prism update otherwise line number highlight is not updated
      Prism.highlightElement(this.jarRef.current);
    });
  }

  render() {
    if (DBG) console.log(...PR('render'));
    const {
      title,
      viewMode,
      jsx,
      lineHighlight,
      openConfirmDelete,
      openConfirmUnload,
      script_page,
      script_text,
      sel_linenum
    } = this.state;
    const { id, bpName, script, projId, onClick, classes } = this.props;
    const { script_page_needs_saving: needsSaving } = WIZCORE.State();
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
        <StyledToggleButton value={VIEWMODE_WIZARD}>Wizard</StyledToggleButton>
        <StyledToggleButton value={VIEWMODE_CODE}>Code</StyledToggleButton>
      </ToggleButtonGroup>
    );

    // BOTTOM BAR ----------------------------------------------------
    const BackBtn = (
      <button
        type="button"
        className={classes.button}
        style={{ alignSelf: 'flex-end' }}
        disabled={needsSaving}
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
        disabled={!needsSaving}
      >
        SAVE TO SERVER
      </button>
    );
    const DialogConfirmDelete = (
      <Dialog
        id="DialogConfirmDelete"
        open={openConfirmDelete}
        message={`Are you sure you want to delete the "${bpName}" script?`}
        yesMessage={`Delete ${bpName}`}
        onClose={this.OnDeleteConfirm}
      />
    );
    const DialogConfirmUnload = (
      <Dialog
        id="DialogConfirmUnload"
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
          display: `${viewMode === VIEWMODE_CODE ? 'inherit' : 'none'}`
        }}
      >
        <code
          id="codejar"
          ref={this.jarRef}
          style={{ width: '100%', height: 'auto' }}
        >
          {script_text}
        </code>
      </pre>
    );

    // WIZARD -----------------------------------------------------------------
    const Wizard = (
      <div
        style={{
          display: `${viewMode === VIEWMODE_WIZARD ? 'flex' : 'none'}`,
          flexDirection: 'column',
          width: '100%'
        }}
      >
        {/* {jsx} */}
        <ScriptViewPane script_page={script_page} sel_linenum={sel_linenum} />
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
