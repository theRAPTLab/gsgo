/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  StackMachine
  programming template: done in AgentFactory.MakeTemplate
  initializing props: smcode program

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import {
  setPropValue,
  refProp,
  callRef,
  pushProp,
  dbgStack,
  pop,
  refReturn
} from './stackmachine-ops';
import { SMProgram, SMScopeRef } from './stackmachine-types';
import Agent from './class-agent';
import SM_Object from './class-sm-object';

/// TEST FUNCTIONS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** initializing an agent means setting properties */
function SMC_GetInit(): SMProgram {
  const program: SMProgram = [
    // initialize values only in an init program
    setPropValue('x', 0),
    setPropValue('y', 0)
  ];
  return program;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SMC_GetUpdate(): SMProgram {
  const program: SMProgram = [
    // run during Agent.Update phase
    refProp('x'),
    callRef('add', 1),
    pushProp('x'),
    // dbgStack(),
    pop(),
    refReturn()
  ];
  return program;
}

/// EXEC FUNCTIONS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Exec(smc: SMProgram, agent: Agent) {
  const stack: SM_Object[] = [];
  const scope: SMScopeRef[] = [];
  smc.forEach(op => op(agent, stack, scope));
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  SMC_GetInit,
  SMC_GetUpdate,
  Exec
};
