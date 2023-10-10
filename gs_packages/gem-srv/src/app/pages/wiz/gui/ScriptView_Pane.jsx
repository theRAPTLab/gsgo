/* eslint-disable prefer-template */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ScriptView_Pane - Script Editing and Highlighting

  Was: PanelScript.jsx

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
import * as CHELPER from 'script/tools/comment-utilities';

import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { withStyles } from '@material-ui/core/styles';
import { UpdateScript } from 'modules/sim/script/tools/script-to-jsx';
import { ScriptViewWiz_Block } from './ScriptViewWiz_Block';
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

import Dialog from '../../components/Dialog';

import { useStylesHOC } from '../../helpers/page-xui-styles';

import PanelChrome from '../../components/PanelChrome';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('PANELSCRIPT');
const DBG = false;

const VIEWMODE_WIZARD = 'wizard';
const VIEWMODE_CODE = 'code';

let needsSyntaxReHighlight = false;

let m_scrollTop = 0; // scroll position of the PanelChrome scroll container

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
class ScriptView_Pane extends React.Component {
  constructor() {
    super();
    const { script_page, script_text, sel_linenum, sel_linepos, cur_bdl } =
      WIZCORE.State();
    this.state = {
      viewMode: VIEWMODE_WIZARD, // 'code',
      jsx: '',
      lineHighlight: undefined,
      openConfirmDelete: false,
      openConfirmUnload: false,
      confirmUnloadCallback: {}, // fn called when user confirms unload
      gemscript_page: script_page,
      script_text,
      sel_linenum,
      sel_linepos,
      isInitScript: false,
      cur_bdl, // needed to update initScript
      bookmarks: [],
      sel_bookmarklinenum: 0,
      scrollContainer: {}
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

    this.HandleWizUpdate = this.HandleWizUpdate.bind(this);
    this.HandleScrollUpdate = this.HandleScrollUpdate.bind(this);
    this.HandleSimDataUpdate = this.HandleSimDataUpdate.bind(this);
    this.GetTitle = this.GetTitle.bind(this);
    // DEPRECATED?  No one is Raising SCRIPT_UI_CHANGED at the moment?
    this.HandleScriptUIChanged = this.HandleScriptUIChanged.bind(this);
    this.OnSaveToServer = this.OnSaveToServer.bind(this);
    this.OnSelectScriptClick = this.OnSelectScriptClick.bind(this);
    this.HighlightDebugLine = this.HighlightDebugLine.bind(this);
    this.OnDelete = this.OnDelete.bind(this);
    this.OnDeleteConfirm = this.OnDeleteConfirm.bind(this);
    this.OnUnloadConfirm = this.OnUnloadConfirm.bind(this);
    this.OnToggleWizard = this.OnToggleWizard.bind(this);
    this.OnBookmarkSelect = this.OnBookmarkSelect.bind(this);

    UR.HandleMessage('NET:UPDATE_MODEL', this.HandleSimDataUpdate);
    // DEPRECATED?  No one is Raising SCRIPT_UI_CHANGED at the moment?
    UR.HandleMessage('SCRIPT_UI_CHANGED', this.HandleScriptUIChanged);
    UR.HandleMessage('HACK_DEBUG_MESSAGE', this.HighlightDebugLine);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
    WIZCORE.SubscribeState(this.HandleWizUpdate);

    window.addEventListener('beforeunload', e => {
      if (SKIP_RELOAD_WARNING) return;
      if (WIZCORE.State().script_page_needs_saving) {
        // Show "Leave site?" dialog
        e.preventDefault();
        e.returnValue = ''; // required by Chrome
        return e;
      }
    });

    // scroll listener
    // the scroll container is actually the PanelChrome, so we grab the parent
    const scrollContainer =
      document.getElementById('ScriptViewScroller').parentElement;
    scrollContainer.addEventListener('scroll', event => {
      m_scrollTop = scrollContainer.scrollTop;
    });
    this.setState({ scrollContainer });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  componentWillUnmount() {
    WIZCORE.UnsubscribeState(this.HandleWizUpdate);
    UR.UnhandleMessage('NET:UPDATE_MODEL', this.HandleSimDataUpdate);
    UR.UnhandleMessage('SCRIPT_UI_CHANGED', this.HandleScriptUIChanged);
    UR.UnhandleMessage('HACK_DEBUG_MESSAGE', this.HighlightDebugLine);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** INCOMING: handle WIZCORE event updates */
  HandleWizUpdate(vmStateEvent) {
    // EASY VERSION REQUIRING CAREFUL WIZCORE CONTROL
    const { isInitScript } = this.state;
    const {
      script_page,
      script_text,
      init_script_page,
      init_script_text,
      script_page_needs_saving,
      sel_linenum,
      sel_linepos
    } = vmStateEvent;
    const newState = { isInitScript };
    let cb;
    if (script_page) {
      newState.gemscript_page = script_page;
      newState.isInitScript = false;
    }
    if (script_text) {
      newState.script_text = script_text;
      cb = () => {
        this.jar.updateCode(script_text);
        // Force Prism update otherwise line number highlight is not updated
        Prism.highlightElement(this.jarRef.current);
      };
      newState.isInitScript = false;
    }

    // If `init_script_page` state is passed (instaed of `script_page`) then the
    // state update is intended for the initSript.  Use that for the script_page
    if (init_script_page) {
      newState.gemscript_page = init_script_page;
      newState.isInitScript = true;
    }
    if (init_script_text) {
      newState.script_text = init_script_text;
      cb = () => {
        this.jar.updateCode(init_script_text);
        // Force Prism update otherwise line number highlight is not updated
        Prism.highlightElement(this.jarRef.current);
      };
      newState.isInitScript = true;
    }

    // If WIZCORE update included a line selection, then we need to update
    // the scroll position to figure out if we need to scroll the selected
    // line into view after the state update.
    if (sel_linenum !== undefined) {
      newState.sel_linenum = sel_linenum;
      cb = () => this.HandleScrollUpdate();
    }

    // Update Bookmarks
    if (script_page && !init_script_page) {
      // don't add bookmarks for init scripts
      CHELPER.MakeBookmarkViewData(script_page);
      newState.bookmarks = CHELPER.GetBookmarkViewData();
    } else if (init_script_page) {
      // initial script_page load will create bookmarks, so
      // if init_script_page loads, we need to clear the bookmark
      newState.bookmarks = [];
    }

    // if script_page_needs_saving, the setState will trigger a rerender
    // NOTE the callback method
    if (Object.keys(newState).length > 0 || script_page_needs_saving)
      this.setState(newState, cb);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Scroll to the currently selected line if it's not visible
   */
  HandleScrollUpdate() {
    const { scrollContainer } = this.state;
    // The #LineBtnAddBefore button always shows the selected line and ensures
    // the top "+" button is visible in the scroll (as well as the line before)
    const LineBtnAddBefore = document.getElementById('LineBtnAddBefore');
    if (LineBtnAddBefore) {
      const elTop = LineBtnAddBefore.offsetTop;
      const elBottom = elTop + LineBtnAddBefore.clientHeight;
      const containerTop = scrollContainer.offsetTop + m_scrollTop;
      const containerBottom = containerTop + scrollContainer.clientHeight;
      if (containerTop > elTop || elBottom > containerBottom) {
        LineBtnAddBefore.scrollIntoView();
      }
    }
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  HandleSimDataUpdate() {
    needsSyntaxReHighlight = true;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  GetTitle(blueprintName) {
    return `Script: ${blueprintName}`;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
  OnSaveToServer() {
    // abort if slots need saving
    // REVIEW: The more UI-friendly way to do this would probably
    //         be to use a custom dialog that allows you to both
    //         save the slot AND submit to server.
    const { slots_need_saving } = SLOTCORE.State();
    if (slots_need_saving) {
      SLOTCORE.SendState({ slots_save_dialog_is_open: true });
      return;
    }

    // if we're in code view, update the code script first
    const { viewMode, isInitScript, cur_bdl } = this.state;
    const { projId, bpName } = this.props;
    let text;
    if (viewMode === VIEWMODE_CODE) {
      text = this.jar.toString();
      // retain the cur_bdl so initScript can reference the orig script text
      if (isInitScript) WIZCORE.SendState({ cur_bdl, init_script_text: text });
      else WIZCORE.SendState({ script_text: text });
    }
    WIZCORE.SaveToServer(projId, bpName);
    UR.LogEvent('ScriptEdit', ['Save to Server', bpName]);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  HighlightDebugLine(data) {
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

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  OnDelete() {
    this.setState({
      openConfirmDelete: true
    });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  OnDeleteConfirm(yesDelete) {
    const { projId, bpName } = this.props;
    this.setState({
      openConfirmDelete: false
    });
    if (yesDelete) {
      UR.RaiseMessage('SELECT_SCRIPT', { bpName: undefined }); // go to selection screen
      UR.RaiseMessage('NET:BLUEPRINT_DELETE', {
        blueprintName: bpName
      });
      window.close();
    }
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  OnUnloadConfirm(yesLeave) {
    const { unloadEvent, confirmUnloadCallback } = this.state;
    this.setState({
      openConfirmUnload: false
    });
    if (yesLeave) {
      confirmUnloadCallback();
    }
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  OnToggleWizard(event, value) {
    const { cur_bdl, isInitScript } = this.state;
    if (value === null) return; // skip repeated clicks
    if (value === VIEWMODE_CODE) {
      // currently wizard, clicked on code
      // we don't need to do a data update because wizard keeps state updated
      // but we do need to unselect slot editor
      EDITMGR.CancelSlotEdit();
    } else if (value === VIEWMODE_WIZARD) {
      const script_text = this.jar.toString();
      if (isInitScript) {
        // retain the cur_bdl so initScript can reference the orig script text
        WIZCORE.SendState({ cur_bdl, init_script_text: script_text });
      } else WIZCORE.SendState({ script_text });
    }
    this.setState({ viewMode: value }, () => {
      // Force Prism update otherwise line number highlight is not updated
      Prism.highlightElement(this.jarRef.current);
    });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** We use `onInput` because `onChange` will trigger whenever you click to
   *  open the selection menu.
   */
  OnBookmarkSelect(event) {
    event.preventDefault();
    event.stopPropagation();
    const { sel_bookmarklinenum } = this.state;
    const lineNum = event.target.value;
    if (sel_bookmarklinenum !== lineNum) {
      this.setState({ sel_bookmarklinenum: lineNum });
    }
    if (lineNum !== '') {
      // Trigger a line selection with the EDITMGR
      // if the selected lineNum is not "-- select a bookmark --"
      EDITMGR.DispatchClick(event);
    }
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  render() {
    if (DBG) console.log(...PR('render'));
    const {
      title,
      viewMode,
      jsx,
      lineHighlight,
      openConfirmDelete,
      openConfirmUnload,
      gemscript_page,
      script_text,
      sel_linenum,
      sel_linepos,
      isInitScript,
      bookmarks,
      sel_bookmarklinenum
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

    // BOOKMARK ---------------------------------------------------------------
    const BookmarkMenu =
      bookmarks.length < 1 ? (
        ''
      ) : (
        <div
          className={classes.infoDataColor}
          style={{
            display: 'grid',
            gridTemplateColumns: '80px auto',
            padding: '5px'
          }}
        >
          <div>Bookmarks:</div>
          <div>
            <select
              id="BookmarkSelector"
              value={sel_bookmarklinenum}
              onChange={this.OnBookmarkSelect}
              className={classes.infoDataColor}
              style={{ fontSize: '1em', padding: '1px 0 0 5px', margin: '0' }}
            >
              <option value={''}>-- select a bookmark --</option>
              {bookmarks.map(b => (
                <option key={b.lineNum} value={b.lineNum}>
                  {b.lineNum}:&nbsp;{b.comment}
                </option>
              ))}
            </select>
          </div>
        </div>
      );

    // TOP BAR ----------------------------------------------------------------
    const TopBar = (
      <>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={this.OnToggleWizard}
        >
          <StyledToggleButton value={VIEWMODE_WIZARD}>Wizard</StyledToggleButton>
          <StyledToggleButton value={VIEWMODE_CODE}>Code</StyledToggleButton>
        </ToggleButtonGroup>
        {BookmarkMenu}
      </>
    );

    // BOTTOM BAR ----------------------------------------------------
    const BackBtn = !isInitScript && (
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
    // Only show DeleteButton if it's an init script
    const DeleteBtn = !isInitScript && (
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
        onClick={this.OnSaveToServer}
        disabled={!needsSaving}
      >
        SAVE TO SERVER
      </button>
    );
    const DialogConfirmDelete = (
      <Dialog
        id="DialogConfirmDelete"
        open={openConfirmDelete}
        message={`Are you sure you want to delete the "${bpName}" script and characters?`}
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
    // codejar is initialized at mount and needs to be persistent, so it's
    // always defined -- otherwise codejar will generate a 'Cannot read
    // properties of null' error.
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
        <ScriptViewWiz_Block
          gemscript_page={gemscript_page}
          sel_linenum={sel_linenum}
          sel_linepos={sel_linepos}
        />
      </div>
    );

    // RETURN -----------------------------------------------------------------
    return (
      <PanelChrome
        id={id} // used by click handler to identify panel
        // title={updatedTitle} // hide title to reduce complexity
        onClick={onClick}
        topbar={TopBar}
        bottombar={BottomBar}
      >
        <div
          id="ScriptViewScroller"
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

export default withStyles(useStylesHOC)(ScriptView_Pane);
