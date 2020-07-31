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
  Agent,
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
  return (agent: Agent, STATE: T_State): T_OpWait => {
    STATE.stack.push(gv);
  };
};
/** discard values from stack (default 1) */
const pop = (num: Number = 1): T_Opcode => {
  return (agent: Agent, STATE: T_State): T_OpWait => {
    for (let i = 0; i < num; i++) STATE.stack.pop();
  };
};
/** push agent on stack */
const pushAgent = (): T_Opcode => {
  return (agent: Agent, STATE: T_State): T_OpWait => {
    STATE.stack.push(agent);
  };
};
/** push agent.prop on stack */
const pushProp = (propName: string): T_Opcode => {
  return (agent: Agent, STATE: T_State): T_OpWait => {
    STATE.stack.push(agent.prop(propName));
  };
};
/** push agent.prop.value on stack */
const pushPropValue = (propName: string): T_Opcode => {
  return (agent: Agent, STATE: T_State): T_OpWait => {
    STATE.stack.push(agent.prop(propName).value);
  };
};
/** Pop object from stack, read its value, then assign to agent.prop
 */
const popPropValue = (propName: string): T_Opcode => {
  return (agent: Agent, STATE: T_State): T_OpWait => {
    const value = STATE.stack.pop().value;
    agent.prop(propName).value = value;
  };
};

/// IMMEDIATE OPCODES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Directly set object prop with immediate value */
const setPropValue = (propName: string, value: any): T_Opcode => {
  return (agent: Agent): T_OpWait => {
    const prop = agent.prop(propName);
    const old = prop.value;
    prop.value = value;
    if (DBG) console.log(`set ${agent.name()}.${propName}=${value} (was ${old})`);
  };
};

/// STACK INDIRECT OPCODES ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** move top of data stack to scope stack */
const stackToScope = (): T_Opcode => {
  return (agent: Agent, STATE: T_State): T_OpWait => {
    const { scope, stack } = STATE;
    scope.push(stack.pop());
  };
};
/** remove an object from the scope stack */
const scopePop = (): T_Opcode => {
  return (agent: Agent, STATE: T_State): T_OpWait => {
    STATE.scope.pop();
  };
};
/** push the named agent prop on the scope stack */
const scopePushProp = (propName): T_Opcode => {
  return (agent: Agent, STATE: T_State): T_OpWait => {
    const prop = agent.prop(propName);
    STATE.scope.push(prop);
  };
};
/** push the agent on the scope stack */
const scopePushAgent = (): T_Opcode => {
  return (agent: Agent, STATE: T_State): T_OpWait => {
    STATE.scope.push(agent);
  };
};
/** Invoke method() from scoped object. This is like a subroutine.
 *  Any method name and an arbitrary number of argument are passed,
 *  and any results are pushed on the datastack.
 */
const scopedMethod = (methodName: string, ...args: any[]): T_Opcode => {
  return (agent: Agent, STATE: T_State): T_OpWait => {
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
/** Invoke function property on scoped object */
const scopedFunction = (funcName: string, ...args: any[]): T_Opcode => {
  return (agent: Agent, STATE: T_State): T_OpWait => {
    const { scope, stack } = STATE;
    const SOBJ = scope[scope.length - 1];
    // call the function property on the scoped object
    const RSTACK: Array<any> = SOBJ[funcName](...args);
    // push elements returned from scoped call onto our stack
    stack.push(RSTACK);
  };
};
/** Retrieve prop() from scoped object, and push it on the data stack. */
const scopedProp = (propName: string): T_Opcode => {
  return (agent: Agent, STATE: T_State): T_OpWait => {
    const { scope, stack } = STATE;
    const SOBJ: T_Scopeable = scope[scope.length - 1];
    stack.push(SOBJ.prop(propName));
  };
};

/// DEBUG OPCODES /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// support util functions ////////////////////////////////////////////////////
function u_dump(num: number = 0, stack: any[], prompt: string = '<dump>') {
  if (num > stack.length) {
    console.log(`warning: requested ${num} exceeds stack length`);
    // force output the entire stack, which will be short
    num = 0;
  }
  if (num === 0) {
    console.log(`${prompt}:`, stack);
  } else {
    const end = stack.length - 1;
    const arr = [];
    for (let i = num; i--; i > 0) arr.push(stack[end - i]);
    console.log(`${prompt}[${num}]:`, arr);
  }
}
/** Dump the current stack contents to console. Defaults to all.
 *  Optionally dump number of items to dump
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const dbgStack = (num: number = 0): T_Opcode => {
  return (agent, STATE: T_State): T_OpWait => {
    const { stack } = STATE;
    u_dump(num, stack, 'stack');
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Dump the current scope contents to console. Defaults to all.
 *  Optionally dump number of items to dump
 */
const dbgScope = (num: number = 0): T_Opcode => {
  return (agent, STATE: T_State): T_OpWait => {
    const { scope } = STATE;
    u_dump(num, scope, 'scope');
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const dbgAgent = (match: string = ''): T_Opcode => {
  return (agent, STATE: T_State): T_OpWait => {
    if (agent.name() === match) console.log(`agent[${agent.name()}]:`, agent);
  };
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// agent stack opcodes
export { push, pop, pushAgent, stackToScope };
/// agent prop opcodes
export { pushProp, pushPropValue, popPropValue, setPropValue };
/// scope stack opcodes
/// note: for agent scope, just methods+props are accessed directly
export { scopePop, scopePushAgent, scopePushProp, scopedMethod, scopedProp };
/// direct agent manipulation
export { scopedFunction };
/// debug opcodes
export { dbgStack, dbgScope, dbgAgent };
