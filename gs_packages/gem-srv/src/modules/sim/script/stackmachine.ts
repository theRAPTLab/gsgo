/* eslint-disable @typescript-eslint/no-unused-vars */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  StackMachine Commander
  programming blueprint: done in AgentFactory.MakeTemplate
  initializing props: smcode program

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { IAgent, TProgram } from 'lib/t-smc';
import { NumberProp } from 'modules/sim/props/var';
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
} from './ops/stack-ops';
import {
  compareNumbers,
  clearCondition,
  ifLT,
  ifLTE,
  ifGT,
  ifGTE,
  ifEQ
} from './ops/condition-ops';
import { addProp, addFeature } from './ops/blueprint-ops';
import { agentQueue, agentSend, dbgMessage } from './ops/message-ops';
import { dbgOut } from './ops/debug-ops';
import { jitterAgent } from './cmds/agent-cmds';

/// TEST FUNCTIONS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** initializing an agent means setting properties */
const test_smc_init: TProgram = [
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
const test_smc_update: TProgram = [
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
const test_smc_agent_update: TProgram = [
  // run during Agent.Update phase
  // if agent.currentHealth < 10
  //   agent.currentHealth++
  jitterAgent()
];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const test_smc_condition: TProgram = [
  // debugMessage('moof:pickle')
];

/// EXEC FUNCTIONS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Run an SM_Program on an agent
 */
function ExecSMC(smc: TProgram, agent: IAgent) {
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
  test_smc_condition,
  test_smc_agent_update
};
const ScriptCommands = {};
export { StackMachine, ScriptCommands };
