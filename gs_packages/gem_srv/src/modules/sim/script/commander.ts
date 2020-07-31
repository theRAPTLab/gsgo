/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  StackMachine Commander
  programming template: done in AgentFactory.MakeTemplate
  initializing props: smcode program

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { T_Agent, T_State, T_Program } from '../types/t-commander';
import {
  setAgentPropValue,
  stackToScope,
  scopedFunction,
  pushAgentProp,
  pop
} from './ops/basic-ops';
import { dbgAgent, dbgStack } from './ops/debug-ops';

/// TEST FUNCTIONS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** initializing an agent means setting properties */
function SMC_GetInit(): T_Program {
  const program: T_Program = [
    // initialize values only in an init program
    setAgentPropValue('x', 0),
    setAgentPropValue('y', 0)
  ];
  return program;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SMC_GetUpdate(): T_Program {
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
/** run an SM_Program on an agent
 */
function Exec(smc: T_Program, agent: T_Agent) {
  try {
    const state = new T_State();
    smc.forEach(op => op(agent, state));
  } catch (e) {
    console.log(e);
    debugger;
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const StackMachine = { Exec, SMC_GetInit, SMC_GetUpdate };
const ScriptCommands = {};
export { StackMachine, ScriptCommands };
