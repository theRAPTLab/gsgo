/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
import {
  Machine,
  State,
  actions,
  assign,
  send,
  sendParent,
  interpret,
  spawn
} from 'xstate';
import UR from '@gemstep/ursys/client';
// runtime data modules
import INPUTS from './inputs';
import CONDITIONS from './conditions';
import AGENTS from './agents';
import MANAGERS from './managers';
import REFEREE from './referee';

/// DEBUG /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.Prompts.makeLogHelper('SIM');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Hook into URSYS system for lifecycle events
 */
function Initialize() {
  UR.SystemHook('APP_STAGE', () => {});
  UR.SystemHook('APP_START', () => {});
  UR.SystemHook('APP_RUN', () => {});
  UR.SystemHook('APP_UPDATE', StepSimulation);
  UR.SystemHook('APP_NEXT', () => {});
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function LoadSimulation() {
  // load agents and assets
  // prep recording buffer
}
function StartSimulation() {
  // initialize agents and assets
  // start the clock
  // start recording buffer
}
function PauseSimulation() {
  // set the playback rate from 0 to 10
  // can we support backing up in the buffer?
  // can we offer forward simulation from the playback buffer
}
function EndSimulation() {
  // stop simulation
}
function ExportSimulation() {
  // grab data from the simulation
}
function ResetSimulation() {
  // return simulation to starting state
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function StepSimulation(int_ms) {
  /* insert game pause control here */
  console.log(...PR(`StepSimulation(${int_ms})`));
  /* insert game logic here */
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  Initialize,
  LoadSimulation,
  StartSimulation,
  PauseSimulation,
  EndSimulation,
  ExportSimulation,
  ResetSimulation
};
