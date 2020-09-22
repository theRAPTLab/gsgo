/* eslint-disable @typescript-eslint/no-unused-vars */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  StackMachine Commander
  programming template: done in AgentFactory.MakeTemplate
  initializing props: smcode program

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { IAgent, Program } from '../lib/t-smc';
import {
  setAgentPropValue,
  scopedFunction,
  scopedFunctionWithAgent,
  push,
  pushAgentPropValue,
  agentPropToScope,
  agentFeatureToScope,
  scopePop,
  pop,
  dupe
} from './ops/basic-ops';
import { NumberProp } from '../props/var';
import { addProp, addFeature } from './ops/template-ops';
import {
  compareNumbers,
  clearCondition,
  ifLT,
  ifLTE,
  ifGT,
  ifGTE,
  ifEQ
} from './ops/condition-ops';
import { agentQueue, agentSend, dbgMessage } from './ops/message-ops';
import { dbgAgent } from './ops/debug-ops';

/// TEST FUNCTIONS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** initializing an agent means setting properties */
const test_smc_init: Program = [
  // define program
  addProp('currentHealth', NumberProp),
  addFeature('Movement'),
  // init program
  setAgentPropValue('x', 0),
  setAgentPropValue('y', 0),
  agentPropToScope('currentHealth'),
  scopedFunction('setMin', 0),
  scopedFunction('setMax', 100),
  scopedFunction('setTo', 1),
  scopePop(),
  agentFeatureToScope('Movement'),
  scopedFunctionWithAgent('setController', 'student'),
  scopePop()
];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const test_smc_update: Program = [
  // run during Agent.Update phase
  // if agent.currentHealth < 10
  //   agent.currentHealth++
  clearCondition(),
  pushAgentPropValue('currentHealth'),
  push(10),
  compareNumbers(), // sets comparison flags
  ifLT([
    agentPropToScope('currentHealth'), // set scope to prop
    scopedFunction('add', 1) // invoke agent.add(1)
  ]),
  ifEQ([
    agentPropToScope('currentHealth'), // set set to prop
    scopedFunction('setTo', 1)
  ])
];

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const test_smc_condition: Program = [
  // debugMessage('moof:pickle')
];

/// EXEC FUNCTIONS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Run an SM_Program on an agent
 */
function ExecSMC(smc: Program, agent: IAgent) {
  try {
    agent.exec_smc(smc);
  } catch (e) {
    console.log(e);
    // eslint-disable-next-line no-debugger
    debugger;
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const StackMachine = {
  ExecSMC,
  test_smc_init,
  test_smc_update,
  test_smc_condition
};
const ScriptCommands = {};
export { StackMachine, ScriptCommands };
