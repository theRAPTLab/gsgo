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
export * from './dc-script';
export * from './dc-programs';
export * from './dc-filters';
export * from './dc-tests';
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
featureCall Costume setCostume 'bunny.json' 1
# PROGRAM UPDATE
setProp skin 'bunny.json'
featureCall Movement jitterPos -5 5
# PROGRAM THINK
// featureHook Costume thinkHook
# PROGRAM EVENT
onEvent Tick [[
  // happens every second, and we check everyone
  ifExpr {{ agent.name==='bun5' }} [[
    dbgOut 'my tick' 'agent instance' {{ agent.name }}
    dbgOut 'my tock'
  ]]
  // exec {{ agent.prop.Costume.currentFrame.add(1) }}
  ifExpr {{ agent.prop.x.value > 50 }} [[
    featureCall Costume setPose 2
  ]]
  ifExpr {{ agent.prop.x.value < -50 }} [[
    featureCall Costume setPose 3
  ]]
  ifExpr {{ agent.prop.y.value > 50 }} [[
    featureCall Costume setPose 4
  ]]
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
