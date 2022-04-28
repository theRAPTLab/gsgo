/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Simulation Data is a pure data module that can be included anywhere
  to access global data.

  DATACORE modules also manage "derived data" that uses only the modeled
  data. For data that couples this data with an implementation-specific
  need, put that code into APPCORE modules.

  IMPORTANT:
  Do not import other modules into here unless you are absolutely
  sure it will not create a circular dependency!
  This module is intended to be "pure" so any module can import
  it and access its

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

/// FORWARDED EXPORTS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export * from './dc-varprops';
export * from './dc-agents';
export * from './dc-features';
export * from './dc-sim-bundler';
export * from './dc-script-engine';
export * from './dc-named-methods';
export * from './dc-sim-conditions';
export * from './dc-render';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// const PR = UR.PrefixUtil('DATCORE', 'TagRed');

/// DEFAULT TEXT FOR SCRIPT TESTING ///////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DEFAULT_TEXT = `
# BLUEPRINT Bee
# PROGRAM DEFINE
useFeature Costume
useFeature Movement
addProp foodLevel Number 50
featCall Costume setCostume 'bunny.json' 1
# PROGRAM UPDATE
prop agent.skin setTo 'bunny.json'
ifExpr {{true}} [[
  ifExpr {{ false }} [[
    dbgOut 'true'
  ]] [[
    dbgOut 'chained blocks work'
  ]]
]]
`;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetDefaultText() {
  return DEFAULT_TEXT;
}

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// for loading data structures
UR.HookPhase('UR/LOAD_ASSETS', () => new Promise(resolve => resolve('loaded')));
