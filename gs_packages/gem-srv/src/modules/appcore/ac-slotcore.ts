/* eslint-disable no-alert */
/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/no-use-before-define */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  GUI ViewModel Support

  Implement a Model-View-ViewModel style support module for GEMSCRIPT Script
  Wizard Slot Editor renderer.

  STATE MODULE NOTES - State module initialization can only be done once. This
  is similar to setting this.state directly in a React class component
  constructor. The properties set here determine what values are settable, and
  their names must be LOWERCASE and UNIQUE across all StateModules!!! This is to
  help prevent stupid naming errors or ambiguities by forcing you to think
  things through.

  LIFECYCLE NOTES - This module's state data is initialized on load by
  _initializeState(), which occurs well before React initializes

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { TStateObject } from '@gemstep/ursys/types';
import * as CHECK from 'modules/datacore/dc-sim-data-utils';

// load state
const { StateMgr } = UR.class;

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SLOTCORE', 'TagBlue');
const DBG = false;

/// MODULE STATE INITIALIZATION ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// First create the new instance, and extract the methods we plan to use
const STORE = new StateMgr('SlotCore');

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// initial values of state have to be defined for constructors of components
/// that are relying on it, but these are not yet loaded
STORE._initializeState({
  // metadata
  slots_need_saving: false, // flag sent during data initialization by
  slots_save_dialog_is_open: false, // flag used to show confirm save dialog in SelectEditorSlots
  // selection data
  sel_slotpos: -1, // selected slot currently being edited.  If < 0 it is not set
  // slot data
  slots_linescript: [], // lineScript being edited in slot editor -- the whole line
  slots_validation: null, // validation object for the current slot line being edited { validationTokens, validationLog }
  slots_bundle: null // temporary bundle used to store line-based symbol tables
});

/// DERIVED STATE LOGIC ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// spy on incoming SendState events and modify/add events as needed
/// BL NOTE: `state` only contains state objects that have CHANGED, it does not include
///          ALL state objects, but it CAN be used to set other state vars?
STORE._interceptState(state => {
  const { slots_need_saving } = state;
});

/// UI-DRIVEN STATE UPDATES ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Local helper  */
function UpdateSlotValueToken(key, value) {
  // Update slots_linescript
  const { slots_linescript, sel_slotpos } = State();
  // if the scriptToken already exists, update it byRef
  const slotScriptToken =
    slots_linescript[CHECK.OffsetLineNum(sel_slotpos, 'sub')] || // existing token
    {}; // or new object if this is creating a new slot
  // if the token was previously used to as a token, remove the old string/value keys
  // otherwise both keys will be active
  delete slotScriptToken.value;
  delete slotScriptToken.string;
  delete slotScriptToken.boolean;
  delete slotScriptToken.identifier;
  delete slotScriptToken.expr;
  slotScriptToken[key] = value; // We know the scriptToken is a value
  if (sel_slotpos > slots_linescript.length) {
    slots_linescript.push(slotScriptToken); // it's a new token so add it
  }
  const slots_need_saving = true;
  SendState({ slots_linescript, slots_need_saving }); // Update state to trigger validation rerun

  return slots_linescript;
}
/// UI SCREEN HELPERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// DEBUG METHODS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORTED STATE METHODS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { State, SendState, SubscribeState, UnsubscribeState, QueueEffect } = STORE;
export { State, SendState, SubscribeState, UnsubscribeState, QueueEffect };

/// EXPORTED EVENT DISPATCHERS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  UpdateSlotValueToken // handle incoming change from editMgr
};

/// EXPORTED VIEWMODEL INFO UTILS //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {};
