/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  In cases where pure data models must be associated with application-specific
  data or implementation, appcore modules provide the "glue" to create
  those data operations. These APPCORE modules can be imported individually.
  and their methods are designed to centralize shared operations across
  multiple GEMSTEP apps.

  APPCORE modules implement specific data structures and logic that is useful
  for the entire range of application needs in a GEMSTEP netapp. APPCORE
  modules may import DATACORE modules.

  An APPCORE module may be used to manage data loads asynchronously on
  behalf of a React app.

  IMPORTANT:
  Do not import other APPCORE modules into here unless you are absolutely
  sure it will not create a circular dependency!

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as ACLocales from './ac-locales';
import * as ACDevices from './ac-devices';

/// APPCORE MODULES ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// If you just want state, use UR.GetStateMgr('group') instead
export { ACLocales, ACDevices };

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// For loading data structures. AppCore modules could use this for loading
/// async data from a database
UR.HookPhase('UR/LOAD_ASSETS', () => {});

/// DEBUG /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
if (typeof window !== 'undefined')
  window.appcore = {
    ACLocales,
    ACDevices
  };
