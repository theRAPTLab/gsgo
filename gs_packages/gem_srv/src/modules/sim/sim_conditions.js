/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  global condition manager

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { WORLD } from './agents/global';
import { CONDITION_All } from './runtime-core';
import AgentSet from './lib/class-agentset';
import {
  push,
  pushAgentPropValue,
  stackToScope,
  scopedPropValue,
  scopePop
} from './script/ops/basic-ops';
import {
  compareNumbers,
  clearCondition,
  ifLT,
  ifLTE,
  ifGT,
  ifGTE,
  ifEQ
} from './script/ops/condition-ops';
import { dbgStack, dbgOut } from './script/ops/debug-ops';
import { sub, abs } from './script/ops/math-ops';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let as;

// this test returns FALSE 5 times then TRUE 5 times
// since currentHealth increments by 1 and wraps at 10
const update_test = [
  // agentA and agentB are on the stack

  // calculate
  clearCondition(),
  pushAgentPropValue('currentHealth'),
  push(5),
  compareNumbers(), // sets comparison flags
  ifGT([push(true), dbgOut('GT')]),
  ifLTE([push(false), dbgOut('LTE')])
];

// this test is invoked on the WORLD object, and the stack
// has agentA and agentB on the stack
// return true if these should match
const interaction_test = [
  // stack has agenta, agentb on it
  stackToScope(),
  stackToScope(), // scope = [..., B, A]
  // from A
  scopedPropValue('x'),
  scopePop(),
  scopedPropValue('x'),
  // [A.x B.x] on stack, subtract a-b
  sub(),
  abs(),
  push(5),
  // [A:dx B:5]
  // 5 > dx
  // dbgStack(2),
  compareNumbers(),
  ifLT([push(true), dbgOut('sim_conditions intersect')]),
  ifGTE([push(false), dbgOut('-')])
];

/// MODULE HELPERS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SIM_ModuleInit(gloop) {
  gloop.Hook('CONDITIONS_UPDATE', Update);

  as = new AgentSet('Flower', 'Flower');
  as.setTest(interaction_test);
}

/// LIFECYCLE METHODS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Update(int_ms) {
  as.interact();
}
/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  SIM_ModuleInit
};
