/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  StackMachine Commander
  programming template: done in AgentFactory.MakeTemplate
  initializing props: smcode program

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { T_Agent, T_Program } from '../types/t-commander';
import {
  setAgentPropValue,
  stackToScope,
  scopedFunction,
  pushAgentProp,
  pop
} from './ops/basic-ops';
import { NumberProp } from '../props/var';
import { addProp } from './ops/template-ops';
import { dbgAgent, dbgStack } from './ops/debug-ops';

/// TEST FUNCTIONS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** initializing an agent means setting properties */
function TestSMC_Init(): T_Program {
  const program: T_Program = [
    // initialize values only in an init program
    setAgentPropValue('x', 0),
    setAgentPropValue('y', 0),
    addProp('currentHealth', new NumberProp())
  ];
  return program;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestSMC_Update(): T_Program {
  const program: T_Program = [
    // run during Agent.Update phase
    pushAgentProp('x'),
    stackToScope(),
    scopedFunction('add', 1),
    // dbgStack(1),
    // dbgAgent(),
    pop()
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
