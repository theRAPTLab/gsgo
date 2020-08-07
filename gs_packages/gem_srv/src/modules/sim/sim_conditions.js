/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  global condition manager

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { WORLD } from './agents/global';
import { CONDITION_All } from './runtime-core';
import AgentSet from './lib/class-agentset';
import Condition from './lib/class-condition';
import {
  push,
  pushAgentPropValue,
  stackToScope,
  scopedPropValue,
  scopePop,
  pop
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
import { dbgStack, dbgOut, dbgStackCount } from './script/ops/debug-ops';
import { sub, abs } from './script/ops/math-ops';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let ags = null;
let cond = null;

/// TEST PROGRAMS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// this test returns FALSE 5 times then TRUE 5 times
// since currentHealth increments by 1 and wraps at 10
const update_test = [
  // agentA and agentB are on the stack
  dbgStackCount(2, 'start update_test'),
  // calculate
  clearCondition(),
  pushAgentPropValue('currentHealth'),
  push(5),
  compareNumbers(), // sets comparison flags
  ifGT([push(true), dbgOut('GT')]),
  ifLTE([push(false), dbgOut('LTE')]),
  // check result is on stack
  dbgStackCount(1, 'end update_test')
];

// this test is invoked on the WORLD object, and the stack
// has agentA and agentB on the stack
// return true if these should match
const interaction_test = [
  // agentA and agentB are on the stack
  dbgStackCount(2, 'start interaction_test'),
  // calculate
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
  ifLT([push(true)]), // dbgOut('sim_conditions intersect')]),
  ifGTE([push(false)]), // dbgOut('-')]),
  // check result is on stack
  dbgStackCount(1, 'end interaction_test')
];

// this test is executed by agent queue...eventually
const exec_test = [dbgOut('execution')];

/// LIFECYCLE METHODS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ModuleInit(gloop) {
  ags = new AgentSet('Flower', 'Flower');
  cond = new Condition(ags);
  cond.addTest(interaction_test);
  cond.addExec(exec_test);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Update(frame) {
  console.log('condition frame update', frame);
  cond.reset();
  cond.pairTest();
  cond.sendResults();
}

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SIM_ModuleInit(gloop) {
  gloop.Hook('CONDITIONS_UPDATE', Update);
  ModuleInit(gloop);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  SIM_ModuleInit
};
