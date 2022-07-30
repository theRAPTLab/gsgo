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
import UR from '@gemstep/ursys/client';
import * as EDITMGR from 'modules/appcore/ac-editmgr';
import * as WIZCORE from 'modules/appcore/ac-wizcore';
import * as SLOTCORE from 'modules/appcore/ac-slotcore';
import * as CHECK from 'modules/datacore/dc-sim-data-utils';
import * as HELP from 'app/help/codex';
import { SlotEditorSelect_Block } from './SlotEditorSelect_Block';
import Dialog from '../../../pages/components/Dialog';
import { GValidationToken } from '../SharedElements';
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
    let selectedHelp = '';
    const num = String(sel_linenum).padStart(3, '0');
    if (DBG) console.log('SlotEditor slots_validation', slots_validation);

    /// 2. Nothing selected
    if (!slots_validation)
      return (
        <div id="SEB_empty" className="gsled panel panelhelp">
          {L10N.MSG_SELECT_TOKEN}
        </div>
      );

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
      let helpDict;
      const position = CHECK.OffsetLineNum(i, 'add');
      const tokenKey = `${sel_linenum},${position}`;
      const selected = sel_slotpos === position;
      const scriptToken = slots_linescript[i];

      if (selectEditorSelection) {
        helpDict = HELP.ForEditorSelection(selectEditorSelection) || {};
      }

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

      selectedError = selected ? error : selectedError;
      selectedHelp = selected ? helpDict.gsType : selectedHelp;
      if (position === 1 && helpDict) {
        selectedHelp = `${helpDict.keyword}. ${selectedHelp}`;
      }

      // show Delete button if this is the currently selected token
      if (selected && t.error && t.error.code === 'extra')
        extraTokenName = t.unitText;

      tokenList.push(
        <GValidationToken
          key={tokenKey}
          tokenKey={tokenKey}
          position={position}
          selected={selected}
          type={t.gsType} // over the token box
          name={t.gsName} // added
          label={label} // inside the token box
          error={error}
          help={'wakawaka'}
          viewState={viewState}
          isSlot
        />
      );
    }

    /// slots - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const slotsjsx = (
      <div
        id="SEB_slots"
        className="gsled tokenList"
        style={{
          gridTemplateColumns: `repeat(${validationTokenCount},auto)`
        }}
      >
        {tokenList}
      </div>
    );

    /// choices - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const choicesjsx = (
      <div id="SEB_choices" className="gsled choices">
        <div className="gsled choicesline gwiz styleError">{selectedError}</div>
        {extraTokenName && (
          <div className="gsled choicesline gwiz styleError">
            <button onClick={this.DeleteSlot} style={{ width: 'fit-content' }}>
              DELETE &quot;{extraTokenName}&quot;
            </button>
          </div>
        )}
        <SlotEditorSelect_Block selection={selectEditorSelection} />
        <div className="gsled choicesline choiceshelp">{selectedHelp}</div>
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
        >
          Save
        </button>
      </div>
    );

    /// help - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const keywordHelp =
      'Use the "prop" keyword to set properties to specific values and do simple arithmetic.';
    const helpjsx = (
      <div id="SEB_help" className="gsled panelhelp">
        {keywordHelp}
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

    return (
      <div className="gsled panel">
        <div className="gsled panelhelp">EDIT LINE: {num}</div>
        {slotsjsx}
        {choicesjsx}
        {controlbarjsx}
        {helpjsx}
        {confirmSaveDialog}
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default SlotEditor_Block;
