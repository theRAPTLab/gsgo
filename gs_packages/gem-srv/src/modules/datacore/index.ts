/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Simulation Data is a pure data module that can be included anywhere
  to access global data.

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
export * from './dc-script-bundle';
export * from './dc-script-engine';
export * from './dc-named-methods';
export * from './dc-interactions';
export * from './dc-sim';
export * from './dc-render';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// const PR = UR.PrefixUtil('DCORE', 'TagRed');

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
featCall Movement jitterPos -5 5
# PROGRAM THINK
// featureHook Costume thinkHook
# PROGRAM EVENT
onEvent Tick [[
  prop agent.foodLevel sub 2
  dbgOut 'foodLevel' agent.foodLevel
]]
# PROGRAM CONDITION
when Bee sometest [[
  // dbgOut SingleTest
]]
when Bee sometest Bee [[
  // dbgOut PairTest
]]
`;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetDefaultText() {
  return DEFAULT_TEXT;
}

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// for erasing data structures
UR.SystemHook('SIM/RESET', () => {});
