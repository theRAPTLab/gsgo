/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  StackMachine
  programming template: done in AgentFactory.MakeTemplate
  initializing props: smcode program

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import {
  // types
  SMScopeRef,
  SMProgram,
  // ops
  setPropValue,
  refPop,
  refProp,
  scopedCall,
  pushProp,
  pop,
  scopedProp,
  dbgStack
} from './stackmachine-ops';
import Agent from './class-agent';
import GVar from '../properties/var';

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
    scopedCall('add', 1),
    pushProp('x'),
    dbgStack(),
    pop(),
    refPop()
  ];
  return program;
}

/// EXEC FUNCTIONS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Exec(smc: SMProgram, agent: Agent) {
  const stack: GVar[] = [];
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
