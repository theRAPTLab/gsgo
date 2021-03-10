/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  RUNTIME

  It is the "master controller" for the URSYS portion of the app.
  Use this to manage the overall control of the app that are common to all
  independent app modes.

  To enable specific features, import their runtimes from their respective
  home.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { interval } from 'rxjs';
// runtime data modules
// these have their own phasemachine interface hooks

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('RT-MAIN');
const DBG = false;

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// RXJS STREAM COMPUTER //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let SIM_FRAME_MS = interval(33);
let RX_SUB;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.OnPhase('UR/APP_STAGE');
UR.OnPhase('UR/APP_START');
UR.OnPhase('UR/APP_RUN');
UR.OnPhase('UR/APP_RESET');
UR.OnPhase('UR/APP_RESTAGE');

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {};
