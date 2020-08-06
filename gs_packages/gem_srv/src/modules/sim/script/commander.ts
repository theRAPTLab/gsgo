/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  StackMachine Commander
  programming template: done in AgentFactory.MakeTemplate
  initializing props: smcode program

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { T_Agent, T_Program } from '../types/t-smc';
import {
  setAgentPropValue,
  scopedFunction,
  scopedFunctionWithAgent,
  push,
  pushAgentPropValue,
  agentPropToScope,
  agentFeatureToScope,
  scopePop,
  pop
} from './ops/basic-ops';
import { NumberProp } from '../props/var';
import { addProp, addFeature } from './ops/template-ops';
import {
  compareNumbers,
  clearCondition,
  ifLT,
  ifGT,
  ifEQ
} from './ops/condition-ops';

/// TEST FUNCTIONS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** initializing an agent means setting properties */
function TestSMC_Init(): T_Program {
  // this is two programs: define and init
  const program: T_Program = [
    // define program
    addProp('currentHealth', new NumberProp()),
    addFeature('Movement'),
    // init program
    setAgentPropValue('x', 0),
    setAgentPropValue('y', 0),
    agentPropToScope('currentHealth'),
    scopedFunction('setMin', 0),
    scopedFunction('setMax', 100),
    scopePop(),
    agentFeatureToScope('Movement'),
    scopedFunctionWithAgent('setController', 'student'),
    scopePop()
  ];
  return program;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestSMC_Update(): T_Program {
  const program: T_Program = [
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
      scopedFunction('setTo', 0)
    ])
  ];
  return program;
}

/// EXEC FUNCTIONS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Run an SM_Program on an agent
 */
function ExecSMC(smc: T_Program, agent: T_Agent) {
  try {
    agent.exec_smc(smc);
  } catch (e) {
    console.log(e);
    debugger;
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const StackMachine = { ExecSMC, TestSMC_Init, TestSMC_Update };
const ScriptCommands = {};
export { StackMachine, ScriptCommands };
