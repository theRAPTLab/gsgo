/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  global condition manager

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { CONDITIONS } from 'modules/datacore';
import AgentSet from 'lib/class-agentset';
import Condition from 'lib/class-sm-condition';

import {
  push,
  pushAgentPropValue,
  stackToScope,
  scopedPropValue,
  scopePop
} from 'script/ops/_all';
import {
  compareNumbers,
  clearCondition,
  ifLT,
  ifLTE,
  ifGT,
  ifGTE
  //  ifEQ
} from 'script/ops/condition-ops';
import { /* dbgStack, dbgOut,*/ dbgStackCount } from 'script/ops/debug-ops';
import { sub, abs } from 'script/ops/math-ops';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SIM_CONDITIONS');

let conds = [];

/// TEST PROGRAMS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// this test returns FALSE 5 times then TRUE 5 times
// since currentHealth increments by 1 and wraps at 10
const filter_test = [
  // agentA is on the stack
  dbgStackCount(0, 'start filter_test'),
  // calculate
  clearCondition(),
  pushAgentPropValue('currentHealth'),
  push(5),
  compareNumbers(), // sets comparison flags
  ifGT([push(true)]),
  ifLTE([push(false)]),
  // check result is on stack
  dbgStackCount(1, 'end filter_test')
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
  ifLT([push(true)]), // dbgOut('sim-conditions intersect')]),
  ifGTE([push(false)]), // dbgOut('-')]),
  // check result is on stack
  dbgStackCount(1, 'end interaction_test')
];

// this test is executed by agent queue...eventually
const exec_test = [
  stackToScope(),
  scopedPropValue('name'),
  scopedPropValue('name'),
  scopedPropValue('name')
];

/// LIFECYCLE METHODS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ModuleInit(/* gloop */) {
  // these are tests for conditions
  CONDITIONS.set('distx5', interaction_test);
  CONDITIONS.set('health5', filter_test);
  CONDITIONS.set('exectest', exec_test);
  // this was a load test
  // for (let i = 0; i < 100; i++) {
  //   const cond = new Condition(new AgentSet('Bunny'));
  //   cond.addTest(filter_test);
  //   cond.addExec(exec_test);
  //   conds.push(cond);
  // }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Update(/* frame */) {
  // console.log('condition frame update', frame);
  conds.forEach(cond => {
    cond.reset();
    cond.filterTest();
    cond.sendResults();
  });
}

/// MODULE INITIALIZATION /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HookPhase('SIM/CONDITIONS_UPDATE', Update);
UR.HookPhase('UR/APP_CONFIGURE', ModuleInit);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  ModuleInit,
  Update
};
