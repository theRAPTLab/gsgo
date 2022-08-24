/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SlotEditor_Block

  UI for students to edit individual gemscript lines word by word.


  DATA

    SlotEditor basically displays `slots_validation`.

    Even though `slots_validation` is the main data that SlotEditor
    displays, the key slot edit data is actually the `slots_linescript` state.
    `slots_validation` is directly derived from `slots_linescript` every time
    `slots_linescript` changes.

    Any changes to the slot are:
    1. Handled by EDITMGR.DispatchClick
    2. EDITMGR.DispatchClick updates the `slots_linescript` state.
    3. The state update triggers _interceptState,
      ...which validates 'slots_linescript'
      ...and creates a new `slots_validation` state.

    Any changes in selection are:
    1. Handled by EDITMGR.DispatchClick
      ...which updates the various sel_* states
    2. The state update triggers _interceptState,


  UI

    Key User Input Triggers
    User clicks are all handled by EDITMGR.DispatchClick, which in turn sets:
    * script page click => `sel_linenum`/`sel_linepos` -- Any clicks in the script page will result in
      1.  `sel_slotpos` -- the currently selected slot is updated
      2.  `slots_linescript` and `slots_validation` -- _interceptState will also update

    * slot click => 'sel_slotpos'
      1. `sel_slotpos` change
      2.  `slots_linescript` and `slots_validation` -- _interceptState will also update

    * choice click => 'slots_linescript`
      1.  `slots_linescript` is updated with the clicked choice
      2.  Secondary: `sel_slotpos` is advanced to the next slot

    * value data input => 'slots_linescript'
      1.  SLOTCORE.UpdateSlotValue handles the inputs directly from SelectEditor.
          ...which updates `slots_linescript`

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
/*
    Slot Help
    RATIONALE: This should be a secondary helpDict system, the primary one being for the
                main "Keyword Help".  But in addition to the general keyword helpDict,
                as studenters data for individual slots, they'll need helpDict understanding
                what each individual slot piece is.

                This should show either:
                a. The choice token being hovered over (e.g. x or energyType)
                b. If no hover, then it should show the currently selected choice

    REVIEW: Retreive from validation token?
*/

import React from 'react';
import merge from 'deepmerge';
import UR from '@gemstep/ursys/client';
import * as EDITMGR from 'modules/appcore/ac-editmgr';
import * as WIZCORE from 'modules/appcore/ac-wizcore';
import * as SLOTCORE from 'modules/appcore/ac-slotcore';
import * as CHECK from 'modules/datacore/dc-sim-data-utils';
import * as HELP from 'app/help/codex';
import { SlotEditorSelect_Block } from './SlotEditorSelect_Block';
import Dialog from '../../../pages/components/Dialog';
import { GValidationToken, StackUnit } from '../SharedElements';
import { GUI_EMPTY_TEXT } from 'modules/../types/t-script.d'; // workaround to import constant

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = UR.PrefixUtil('DEWIZ', 'TagApp');

/// LOCALIZATION
const L10N = {};
L10N.TOKEN = 'word'; // script word on script_page
L10N.LINE = 'line'; // script line
L10N.MSG_SELECT_TOKEN = `Click on a ${L10N.LINE} on the left to edit it.`;
L10N.initCap = ref => L10N[ref][0].toUpperCase() + L10N[ref].slice(1);

/// ROOT APPLICATION COMPONENT ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class SlotEditor_Block extends React.Component {
  constructor(props) {
    super(props);
    this.state = SLOTCORE.State();
    this.HandleSlotUpdate = this.HandleSlotUpdate.bind(this);
    this.SaveSlot = this.SaveSlot.bind(this);
    this.CancelSlotEdit = this.CancelSlotEdit.bind(this);
    this.DeleteSlot = this.DeleteSlot.bind(this);
    this.HandleSaveDialogClick = this.HandleSaveDialogClick.bind(this);
  }

  componentDidMount() {
    SLOTCORE.SubscribeState(this.HandleSlotUpdate);
  }

  componentWillUnmount() {
    SLOTCORE.UnsubscribeState(this.HandleSlotUpdate);
  }

  /// STATE UPDATE HANDLERS /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** INCOMING: handle SLOTCORE event updates */
  HandleSlotUpdate(vmStateEvent) {
    // EASY VERSION REQUIRING CAREFUL WIZCORE CONTROL
    this.setState(vmStateEvent);
    // CAREFUL VERSION
    // const { script_page } = vmStateEvent;
    // if (script_page) this.setState({ script_page });
  }

  /// UI EVENT HANDLERS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  SaveSlot() {
    EDITMGR.SaveSlotLineScript();
  }
  CancelSlotEdit() {
    EDITMGR.CancelSlotEdit();
  }
  DeleteSlot() {
    EDITMGR.DeleteSlot();
  }
  // -- Save Dialog helpers
  HandleSaveDialogClick(doSave) {
    SLOTCORE.SendState({ slots_save_dialog_is_open: false }, () => {
      if (doSave) this.SaveSlot();
    });
  }

  /// RENDERER ////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  render() {
    /// PREPARE RENDER DATA  - - - - - - - - - - - - - - - - - - - - - - - - -
    /// 1. Get Slot Definitions
    const { sel_linenum } = WIZCORE.State();
    const {
      slots_linescript,
      slots_validation,
      sel_slotpos,
      slots_need_saving,
      slots_save_dialog_is_open
    } = this.state;
    const selectEditorSelection = WIZCORE.SelectedTokenInfo();
    // appending slot information to SelectedTokenInfo
    if (selectEditorSelection) {
      selectEditorSelection.sel_slotpos = sel_slotpos;
      selectEditorSelection.slots_linescript = slots_linescript;
      selectEditorSelection.slots_validation = slots_validation;
    }
    let selectedError = '';
    const num = String(sel_linenum).padStart(3, '0');
    if (DBG) console.log('SlotEditor slots_validation', slots_validation);

    /// 2. Nothing selected
    if (!slots_validation)
      return (
        <div id="SEB_empty" className="gsled panel panelhelp">
          {L10N.MSG_SELECT_TOKEN}
        </div>
      );

    /// 3. HELP Declarations
    let generalHelp = 'default generalHelp'; // generic help for the gsType
    let selectedChoiceHelp = 'default selectedChoiceHelp'; // help for the selected choice (not slot)
    let keywordHelp;
    let featName; // used to track featCall methods

    /// 3. Process each validation token
    const { validationTokens } = slots_validation;
    const tokenList = [];
    const validationTokenCount = validationTokens.length;
    let extraTokenName;
    for (let i = 0; i < validationTokenCount; i++) {
      let label;
      let type;
      let viewState;
      let error;
      // let helpDict;
      const position = CHECK.OffsetLineNum(i, 'add');
      const tokenKey = `${sel_linenum},${position}`;
      const isSelected = sel_slotpos === position;
      const scriptToken = slots_linescript[i];

      const t = validationTokens[i];
      if (t.error && scriptToken) {
        // 1. Error with an entered value
        //    if there's an error in the token, show the current unitText value,
        //    but fall back to gsType if there's no value
        label = t.unitText || t.gsType || label;
        viewState = t.error.code;
        error = t.error.info;
      } else if (t.error) {
        // 2. Error because no value
        //    if there is not current value, show the expected gsType, else show syntax label
        label = t.gsType || label;
        // if the error is vague, use vague, else use empty
        if (t.error.code === 'vague') viewState = 'vague';
        else viewState = 'empty-editing';
        error = t.error.info;
      } else {
        // 3. No error, just show token
        label = t.unitText || GUI_EMPTY_TEXT;
        viewState = t.viewState;
      }

      selectedError = isSelected ? error : selectedError;

      // HELP
      let tokenHelpText;
      // -- featCall HACK - - - - - - - - - - - - - - - - - -
      // peek at keyword.  If it's a featCall, we need to
      // pull out the feature name to pass on to m_generateTokenHelp
      if (i === 0) {
        // is keyword
        if (t.unitText === 'featCall') {
          const objref_tok = validationTokens[1].unitText.split('.');
          // featName will be passed to HELP.ForChoice as the parentLabel
          // This is how we tell HELP to look up a featMethod instead of regular prop method
          featName = objref_tok.length > 1 ? objref_tok[1] : objref_tok[0];
        }
        if (t.unitText === 'when') {
          // A 'test' method will call up conditions tests
          featName = 'test';
        }
      }

      // -- Helper - - - - - - - - - - - - - - - - - -
      function m_generateTokenHelp(token, helpDict, parentLabel) {
        // REVIEW: Can we use simple HELP call?

        const help = HELP.ForChoice(token.gsType, token.unitText, parentLabel);
        const helpTxt = help
          ? help.info || help.input || help.name
          : 'notok found';
        return helpTxt;
      }
      // - - - - - - - - - - - - - - - - - - - - - -
      //
      // -- only generate help for the currently selected item
      if (selectEditorSelection && isSelected) {
        const helpDict = HELP.ForEditorSelection(selectEditorSelection) || {};
        if (!helpDict)
          throw new Error(
            `SlotEditor_Block could not find help for ${selectEditorSelection}`
          );
        // HELP 1: General -- shows in Choices area
        generalHelp = helpDict.gsInput;
        // HELP 2: tokenHelp shows as popup on hover -- shows in Slot area
        tokenHelpText = m_generateTokenHelp(t, helpDict, featName);
        const selectedTokenLabel = t.unitText;
        // HELP 3: Selected -- shows in Choices area
        //         'Selected' is usually the token!
        selectedChoiceHelp = `SELECTED: ${
          selectedTokenLabel ? selectedTokenLabel : ''
        }${tokenHelpText ? ': ' + tokenHelpText : ''}`;
      } else if (selectEditorSelection) {
        // NOT Currently selected token, but We still need to generate tokenHelp for the other slots
        // HELP 2: tokenHelp shows as popup on hover -- shows in Slot area
        const SEselection = merge.all([selectEditorSelection || {}]); // clone, catch undefined selectEditorSelection
        SEselection.sel_slotpos = position; // set sel_slotpos for the other non-selected slots
        const helpDict = HELP.ForEditorSelection(SEselection) || {};
        tokenHelpText = m_generateTokenHelp(t, helpDict, featName);
      }

      if (i === 0) keywordHelp = tokenHelpText;

      // show Delete button if this is the currently selected token
      if (isSelected && t.error && t.error.code === 'extra')
        extraTokenName = t.unitText;

      tokenList.push(
        <GValidationToken
          key={tokenKey}
          tokenKey={tokenKey}
          position={position}
          selected={isSelected}
          type={t.gsType} // over the token box
          name={t.gsName} // added
          label={label} // inside the token box
          error={error}
          help={tokenHelpText}
          viewState={viewState}
          isSlot
        />
      );
    }

    /// help - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const generalSlotEditorHelp = (
      <>
        Editing Line {num}
        <br />
        Click on a word to edit it.
        <br />
        Click &quot;Save {L10N.initCap('LINE')}&quot; (below) to save changes to
        this line ({num}).
        <br />
        Click &quot;Save to Server&quot; (left panel, bottom) to save the whole
        Character script for everyone.
      </>
    ); // placeholder help
    const generalSlotEditorHelpJsx = (
      <div id="SEB_help" className="gsled panelhelp">
        {generalSlotEditorHelp}
      </div>
    );

    /// slots - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const slotsjsx = (
      <div id="SEB_slots" className="gsled tokenList">
        <div
          className="gsled tokenList choiceshelp"
          style={{ paddingBottom: '20px', marginTop: '0' }}
        >
          {keywordHelp}
        </div>
        <div
          className="gsled tokenListItems"
          style={{
            gridTemplateColumns: `repeat(${validationTokenCount},auto)`
          }}
        >
          {tokenList}
        </div>
      </div>
    );

    /// choices - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const choicesjsx = (
      <div id="SEB_choices" className="gsled choices">
        {selectedError && (
          <div className="gsled choicesline gwiz styleError">{selectedError}</div>
        )}
        {extraTokenName && (
          <div className="gsled choicesline gwiz styleError">
            <button onClick={this.DeleteSlot} style={{ width: 'fit-content' }}>
              DELETE &quot;{extraTokenName}&quot;
            </button>
          </div>
        )}
        <SlotEditorSelect_Block selection={selectEditorSelection} />
        <div className="gsled choicesline choiceshelp">{selectedChoiceHelp}</div>
      </div>
    );

    /// control bar - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const controlbarjsx = (
      <div id="SEB_cancelsave" className="gsled button-bar">
        <button type="button" className="secondary" onClick={this.CancelSlotEdit}>
          Cancel
        </button>
        &nbsp;
        <button
          type="button"
          disabled={!slots_need_saving}
          onClick={this.SaveSlot}
          style={{ fontWeight: `${slots_need_saving ? 'bold' : 'normal'}` }}
        >
          Save {L10N.initCap('LINE')}
        </button>
      </div>
    );

    /// save dialog - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // -- Save Dialog Display Data
    const lineScript = SLOTCORE.State().slots_linescript || {}; // if no line is selected yet
    const selectedLineText = lineScript
      ? WIZCORE.GetLineScriptText(lineScript)
      : '';
    const confirmSaveDialog = (
      <Dialog
        id="ConfirmSlotSaveDialog"
        open={slots_save_dialog_is_open}
        title={'Save line?'}
        message={
          <>
            Are you sure you want to exit without saving the line
            <br />
            <span style={{ color: 'blue' }}>{selectedLineText}</span>?
          </>
        }
        yesMessage={`Save Changes`}
        noMessage={`Cancel`}
        onClose={this.HandleSaveDialogClick}
      />
    );

    /// line number - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const lineNumLabel = (
      <span style={{ color: 'white' }}>
        LINE <b>{num}</b>
      </span>
    );

    /// render - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    return (
      <div className="gsled panel">
        <div
          className="gsled panelhelp"
          style={{ display: 'flex', justifyContent: 'space-between' }}
        >
          <StackUnit
            type="editor"
            label={lineNumLabel}
            open
            style={{ color: 'white' }}
          >
            {generalSlotEditorHelpJsx}
          </StackUnit>
        </div>
        <div
          className="gsled panelhelp"
          style={{ display: 'flex', justifyContent: 'right' }}
        >
          {controlbarjsx}
        </div>
        {slotsjsx}
        <div className="gsled choices choicesline choiceshelp">
          INSTRUCTIONS: {generalHelp}
        </div>
        {choicesjsx}
        {confirmSaveDialog}
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default SlotEditor_Block;
