/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  StackMachine
  programming template: done in AgentFactory.MakeTemplate
  initializing props: smcode program

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { Agent, SM_Object, SM_Program } from './stackmachine-types';
import {
  setPropValue,
  refProp,
  callRef,
  pushProp,
  dbgStack,
  pop,
  refReturn
} from './stackmachine-ops';

/// TEST FUNCTIONS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** initializing an agent means setting properties */
function SMC_GetInit(): SM_Program {
  const program: SM_Program = [
    // initialize values only in an init program
    setPropValue('x', 0),
    setPropValue('y', 0)
  ];
  return program;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SMC_GetUpdate(): SM_Program {
  const program: SM_Program = [
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
function Exec(smc: SM_Program, agent: Agent) {
  const stack: Array<SM_Object> = [];
  const scope: Array<SM_Object> = [];
  smc.forEach(op => op(agent, stack, scope));
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  SMC_GetInit,
  SMC_GetUpdate,
  Exec
};
