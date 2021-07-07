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

/// FORWARDED EXPORTS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export * from './ac-locales';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// const PR = UR.PrefixUtil('APPCORE', 'TagRed');

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// for loading data structures
UR.HookPhase('UR/LOAD_ASSETS', () => new Promise(resolve => resolve()));
