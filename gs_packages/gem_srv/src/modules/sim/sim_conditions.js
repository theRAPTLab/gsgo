/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  global condition manager

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { WORLD } from './agents/global';
import { CONDITION_All } from './runtime-core';
import AgentSet from './lib/class-agentset';
import { push, pushAgentPropValue } from './script/ops/basic-ops';
import {
  compareNumbers,
  clearCondition,
  ifLT,
  ifLTE,
  ifGT,
  ifEQ
} from './script/ops/condition-ops';
import { dbgStack, dbgOut } from './script/ops/debug-ops';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let as;

/// MODULE HELPERS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// LIFECYCLE METHODS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Update(int_ms) {
  as.filter();
}

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SIM_ModuleInit(gloop) {
  gloop.Hook('CONDITIONS_UPDATE', Update);
  // this test returns FALSE 5 times then TRUE 5 times
  // since currentHealth increments by 1 and wraps at 10
  const test = [
    clearCondition(),
    pushAgentPropValue('currentHealth'),
    push(5),
    compareNumbers(), // sets comparison flags
    ifGT([push(true)]),
    ifLTE([push(false)])
  ];
  as = new AgentSet('Flower', test);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  SIM_ModuleInit
};
