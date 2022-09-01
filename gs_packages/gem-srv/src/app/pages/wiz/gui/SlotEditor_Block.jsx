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


  HELP

    There are 5 different kind of help on this page (not including the help
    in embedded ObjRefSelector_Block or EditSymbol_Block):

      1. keywordHelpTxt        => static | Overall help for the selected keyword
      2. syntaxHelpTxt         => hover  | Help for the hovered slot, explain what the slot is
      3. tokenHelpTxt
         -- empty slot         => hover  | Instructions for the empty slot
         -- selected item      => hover  | Information on the current selected slot item
      4. instructionsHelpTxt   => static | Instructions for the selected slot
      5. selectedChoiceHelpTxt => static | Information on the selected choice

    The source of the help information comes from different validation tokens.
    Most help is keyed off of the validation token's gsType property.
    Syntax help is keyed off the validation token's gsName property, since
    that can be set to feature-specific reference, e.g. `touchTypeString`
    options for the Touches.touchType prop.

      1. keywordHelpTxt        => keyword.info => keywordTok.gsType.info
      2. syntaxHelpTxt         => tok.gsName.info
      3. tokenHelpTxt
         -- empty slot         => tok.gsType.input
         -- selected item      => tok.gsType.info
      4. instructionsHelpTxt   => tok.gsType.input
      5. selectedChoiceHelpTxt => tok.gsType.info

    Most help lookup involves a call to HELP/codex.ForChoice, passing the
    current type information (gsType or gsName).
    The exception are methods.  ValidationTokens contain help information
    for the GVar and feature methods, so these are read directly from
    the validation tokens.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

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
const PR = UR.PrefixUtil('SLOTEDITOR', 'TagApp');

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
    if (DBG) console.log(...PR('SlotEditor slots_validation', slots_validation));

    /// 2. Nothing selected, render blank line
    if (!slots_validation)
      return (
        <div id="SEB_empty" className="gsled panel panelhelp">
          {L10N.MSG_SELECT_TOKEN}
        </div>
      );

    /// 3. HELP Declarations
    let keyword; // used to detect `featProp` and `featCall` for feat method arg help
    let keywordHelpTxt; // same help for ALL slots tokens
    let instructionsHelpTxt = <></>; // generic instructions for the gsType
    let selectedChoiceHelpTxt = 'default selectedChoiceHelp'; // help for the selected choice (not slot)
    let featName; // used to track featCall methods

    /// 4. Process each validation token
    const { validationTokens } = slots_validation;
    const tokenList = [];
    const validationTokenCount = validationTokens.length;
    let extraTokenName;
    for (let i = 0; i < validationTokenCount; i++) {
      let label;
      let type;
      let viewState;
      let error;
      const position = CHECK.OffsetLineNum(i, 'add');
      const tokenKey = `${sel_linenum},${position}`;
      const isSelected = sel_slotpos === position;
      const scriptToken = slots_linescript[i];

      const vtok = validationTokens[i];
      if (vtok.error && scriptToken) {
        // 1. Error with an entered value
        //    if there's an error in the token, show the current unitText value,
        //    but fall back to gsType if there's no value
        label = vtok.unitText || vtok.gsType || label;
        viewState = vtok.error.code;
        error = vtok.error.info;
      } else if (vtok.error) {
        // 2. Error because no value
        //    if there is not current value, show the expected gsType, else show syntax label
        label = vtok.gsType || label;
        // if the error is vague, use vague, else use empty
        if (vtok.error.code === 'vague') viewState = 'vague';
        else viewState = 'empty-editing';
        error = vtok.error.info;
      } else {
        // 3. No error, just show token
        label = vtok.unitText || GUI_EMPTY_TEXT;
        viewState = vtok.viewState;
      }
      selectedError = isSelected ? error : selectedError;

      // HELP
      let tokenHelpTxt;
      let syntaxHelpTxt;
      // Save off `keyword` and `featName` for processing of subsequent line tokens
      // HELP needs to know to look up a featMethod instead of regular prop method
      // To do that, featName needs to be passed to HELP.ForChoice as the parentLabel
      // To determine featName, peek at keyword.  If it's a featCall, we need to
      // pull out the feature name to pass on to m_generateTokenHelp
      if (i === 0) {
        // is keyword
        keyword = vtok.unitText;
        // deref featName
        if (['featCall', 'featProp'].includes(vtok.unitText)) {
          const objref_tok =
            validationTokens.length > 1
              ? validationTokens[1].unitText.split('.')
              : [];
          featName = objref_tok.length > 1 ? objref_tok[1] : objref_tok[0];
        }
        if (vtok.unitText === 'when') featName = 'test'; // A 'test' method will call up conditions tests
      }

      // show help on right side if this token is on the right
      const isRightSide = i / validationTokenCount >= 0.5;

      // NEW SIMPLER HELP  - - - - - - - - - - - - - - - - - -
      // One of the challenges here is that we need to look at the context
      // of the whole script line in order to understand what to ask for.
      // e.g. a "string" can be different things depending on the keyword
      // and method and the feature and the feature method or feature prop
      // being referenced on the script line.
      // -- 0. Set initial values
      if (i === 0 && vtok.unitText === '') {
        // BLANK LINE, force keyword
        vtok.gsName = vtok.gsType = 'keyword';
        vtok.unitText = undefined;
      }
      //    The tokenizer will set unitText to the string "undefined", so we want to convert it to
      //    an undefined object else "undefined" will be displayed as a value
      const selectedValue =
        vtok.unitText === 'undefined' ? undefined : vtok.unitText;
      // -- 1. Get Help Text Objects: gsNameHelp and gsTypeHelp
      let gsNameHelp;
      let gsTypeHelp;
      //    1A. gsTypeHelp
      if (vtok.gsType === 'method' && selectedValue && keyword !== 'featCall') {
        // Special handling for GVar and featProp methods
        // method help is defined in the Symbols declaration for GVars and featProps
        // so just look that up directly from the validation token rather than relying on the codex
        gsTypeHelp = vtok.methods ? vtok.methods[selectedValue] : {};
      } else {
        gsTypeHelp = HELP.ForChoice(vtok.gsType, selectedValue, featName);
      }
      //    1B. gsNameHelp
      if (
        !['keyword', 'method'].includes(vtok.gsType) &&
        ['featCall', 'featProp'].includes(keyword)
      ) {
        // is a feature prop arg or feature method arg, so we want to use
        // the featProp lookup.
        // We have to do this here and not in ForChoice b/c we don't have
        // access to the keyword and featName
        gsNameHelp = HELP.ForFeatProp(vtok.gsName, featName); // selectedValue triggers featPropHelp
      } else {
        gsNameHelp = HELP.ForChoice(vtok.gsName, undefined); // selectedValue = undefined to force type lookup
      }
      // -- 2. Map results to help types
      if (i === 0) keywordHelpTxt = gsTypeHelp.input; // establish keywordHelp if this is the keyword
      syntaxHelpTxt =
        gsNameHelp.info ||
        'GSNAME NOT FOUND, FALLING BACK TO TYPE.INFO:' + gsTypeHelp.info; // fall back to gsTypeHellp if there's no gsName help
      tokenHelpTxt =
        selectedValue === undefined
          ? gsTypeHelp.input // if slot is empty, show input instructions
          : gsTypeHelp.info || gsTypeHelp.input; // fall back to 'input' if no 'info' (keywords only have input defined)
      if (isSelected) {
        // establish the instructions and selected choice help IF this curr
        instructionsHelpTxt = (
          <>
            {gsTypeHelp.input && (
              <>
                {gsTypeHelp.input}
                <br />
              </>
            )}
            {gsNameHelp.input}
          </>
        );
        selectedChoiceHelpTxt = gsTypeHelp.info;
      }

      // show Delete button if this is the currently selected token
      if (isSelected && vtok.error && vtok.error.code === 'extra')
        extraTokenName = vtok.unitText;

      tokenList.push(
        <GValidationToken
          key={tokenKey}
          tokenKey={tokenKey}
          position={position}
          selected={isSelected}
          type={vtok.gsType} // over the token box
          name={vtok.gsName} // added
          label={label} // inside the token box
          error={error}
          syntaxHelp={syntaxHelpTxt}
          help={tokenHelpTxt}
          viewState={viewState}
          isSlot
          isRightSide={isRightSide} // force help popup to right align
        />
      );
    }

    /// line edit help - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const lineEditHelp = (
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
    const lineEditHelpJsx = (
      <div id="SEB_help" className="gsled panelhelp">
        {lineEditHelp}
      </div>
    );

    /// button bar (cancel / save )- - - - - - - - - - - - - - - - - - - - - -
    const buttonbarjsx = (
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

    /// slots - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const slotsjsx = (
      <div id="SEB_slots" className="gsled tokenList">
        <div
          className="gsled tokenList choiceshelp"
          style={{ paddingBottom: '20px', marginTop: '0' }}
        >
          {keywordHelpTxt}
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
        <div className="gsled choicesline choiceshelp">
          {selectedChoiceHelpTxt}
        </div>
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
            {lineEditHelpJsx}
          </StackUnit>
        </div>
        <div
          className="gsled panelhelp"
          style={{ display: 'flex', justifyContent: 'right' }}
        >
          {buttonbarjsx}
        </div>
        {slotsjsx}
        <div className="gsled choices choicesline choiceshelp">
          INSTRUCTIONS: <br />
          {instructionsHelpTxt}
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
