/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Basic Stack Machine Operations (aka "opcode")

  A StackMachine opcode is a higher order function returning
  a function that receives an agent instance and a stack, scope, and
  conditions object. This function is the "compiled" output of the
  operation.

  JS MOJO: HOFs and closures
  Every opcode (e.g. push) generates a NEW function every time it is called.
  The new function will execute using whatever parameters that were
  passed to the opcode thanks to the closure.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import {
  T_Agent,
  T_Scopeable,
  T_State,
  T_Opcode,
  T_OpWait
} from '../../types/t-commander';

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// STACK OPCODES /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** push object (usually a prop or agent) on stack */
const push = (gv: T_Scopeable): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    STATE.stack.push(gv);
  };
};
/** discard values from stack (default 1) */
const pop = (num: Number = 1): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    for (let i = 0; i < num; i++) STATE.stack.pop();
  };
};
/** push agent on stack */
const pushAgent = (): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    STATE.stack.push(agent);
  };
};
/** push agent.prop on stack */
const pushAgentProp = (propName: string): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    STATE.stack.push(agent.prop(propName));
  };
};
/** push agent.prop.value on stack */
const pushAgentPropValue = (propName: string): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    STATE.stack.push(agent.prop(propName).value);
  };
};
/** Pop object from stack, read its value, then assign to agent.prop
 */
const popAgentPropValue = (propName: string): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    const value = STATE.stack.pop().value;
    agent.prop(propName).value = value;
  };
};

/// IMMEDIATE OPCODES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Directly set agent prop with immediate value */
const setAgentPropValue = (propName: string, value: any): T_Opcode => {
  return (agent: T_Agent): T_OpWait => {
    const prop = agent.prop(propName);
    prop.value = value;
  };
};
/** There is no getAgentPropValue. Use popAgentPropValue */

/// STACK INDIRECT OPCODES ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** move top of data stack to scope stack */
const stackToScope = (): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    const { scope, stack } = STATE;
    scope.push(stack.pop());
  };
};
/** move top of data stack to scope stack */
const scopeToStack = (): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    const { scope, stack } = STATE;
    stack.push(scope.pop());
  };
};
/** remove an object from the scope stack */
const scopePop = (): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    STATE.scope.pop();
  };
};
/** push the named agent prop on the scope stack */
const agentPropToScope = (propName: string): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    const prop = agent.prop(propName);
    STATE.scope.push(prop);
  };
};
/** push the agent on the scope stack */
const agentToScope = (): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    STATE.scope.push(agent);
  };
};
/** push an agent feature on the scope stack */
const agentFeatureToScope = (featName: string): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    STATE.scope.push(agent.feature(featName));
  };
};
/** Retrieve prop() from scoped object, and push it on stack. */
const scopedProp = (propName: string): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    const { scope, stack } = STATE;
    const SOBJ: T_Scopeable = scope[scope.length - 1];
    stack.push(SOBJ.prop(propName));
  };
};
/** Invoke method() from scoped object, return onto stack
 *  This is like a subroutine.
 *  Any method name and an arbitrary number of argument are passed,
 *  and any results are pushed on the datastack.
 */
const scopedMethod = (methodName: string, ...args: any[]): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    const { scope, stack } = STATE;
    const SOBJ = scope[scope.length - 1];
    // call the method, which is also a stackmachine program
    // the results of the method, if any, are returned as a stack
    // so we need to push this onto the existing stack
    const RSTACK: Array<any> = SOBJ.method(methodName)(...args);
    // push elements returned from scoped call onto our stack
    stack.push(RSTACK);
  };
};
/** Invoke function property on scoped object, return onto stack */
const scopedFunction = (funcName: string, ...args: any[]): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    const { scope, stack } = STATE;
    const SOBJ = scope[scope.length - 1];
    // call the function property on the scoped object
    const RSTACK: Array<any> = SOBJ[funcName](...args);
    // push elements returned from scoped call onto our stack
    stack.push(RSTACK);
  };
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// data stack ops
export { push, pushAgent, pushAgentProp, pop };
/// data stack indirect ops
export { pushAgentPropValue, popAgentPropValue };
/// agent direct ops
export { setAgentPropValue };
/// stack utility ops
export { stackToScope, scopeToStack };
/// scope stack ops
export { agentToScope, agentPropToScope, agentFeatureToScope, scopePop };
/// scoped invocation ops
export { scopedMethod, scopedFunction, scopedProp };
