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
  slots_need_saving: false // flag sent during data initialization by
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
export {};

/// EXPORTED VIEWMODEL INFO UTILS //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {};
