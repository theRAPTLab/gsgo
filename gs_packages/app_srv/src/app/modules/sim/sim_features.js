/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Features can (1) modify the agent (2) use agent properties to update
  its own properties stored in the agent (3) queue an event for a later
  stage in the agent's event queue.

  Features are instantiated once.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { FEATURES } from './runtime-core';
import MovementPack from './features/feat-movement';
import TimerPack from './features/feat-timer';

const PR = UR.Prompt('SIM_FEATURES');
console.log(...PR('module parse'));

/// LIBRARY UTILITIES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetByName(name) {
  return FEATURES.get(name);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Register(fpack) {
  FEATURES.set(fpack.name(), fpack);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RegisterFeatures() {
  Register(MovementPack);
  Register(TimerPack);
}

/// PHASE MACHINE INTERFACE ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.SystemHook('SIM', 'RESET', RegisterFeatures);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default { GetByName, Register };
