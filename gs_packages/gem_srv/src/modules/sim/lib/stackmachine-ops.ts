/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  StackMachine Operations

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Agent from './class-agent';
import SM_Object from './class-sm-object';
import { SMOpExec, SMScopeRef } from './stackmachine-types';

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// STACK OPCODES /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** push a SM_Object argument onto the stack for subsequent ops */
const pushVar = (gv: SM_Object): SMOpExec => {
  return (agent: Agent, stack: SM_Object[]) => {
    stack.push(gv);
  };
};

/** Get the prop from agent and push it on the stack */
const pushProp = (propName: string): SMOpExec => {
  return (agent: Agent, stack: SM_Object[]) => {
    stack.push(agent.prop(propName).value);
  };
};

/** discard the top-most values (default to 1) */
const pop = (num: Number = 1): SMOpExec => {
  return (agent: Agent, stack: SM_Object[]) => {
    for (let i = 0; i < num; i++) stack.pop();
  };
};

/** Pop prop from stack, and set agent prop to its value */
const popPropValue = (propName: string): SMOpExec => {
  return (agent: Agent, stack: SM_Object[]) => {
    const value = stack.pop().value;
    agent.prop(propName).value = value;
  };
};

/// IMMEDIATE OPCODES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Set prop from immediatee */
const setPropValue = (propName: string, value: any): SMOpExec => {
  return (agent: Agent) => {
    const prop = agent.prop(propName);
    const old = prop.value;
    prop.value = value;
    if (DBG) console.log(`set ${agent.name()}.${propName}=${value} (was ${old})`);
  };
};

/// STACK INDIRECT OPCODES ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** remove a scope object from the scope stack */
const refReturn = (): SMOpExec => {
  return (agent: Agent, stack: SM_Object[], scope: SMScopeRef[]) => {
    scope.pop();
  };
};

/** add agent prop to scope stack */
const refProp = (propName): SMOpExec => {
  return (agent: Agent, stack: SM_Object[], scope: SMScopeRef[]) => {
    const prop = agent.prop(propName);
    scope.push(prop);
  };
};

/** call method for object on the scope stack  */
const callRef = (methodName: string, ...args: any[]): SMOpExec => {
  /* TODO: SM_Objects and Agents need to have the same prop/method interface */
  return (agent: Agent, stack: SM_Object[], scope: SMScopeRef[]) => {
    const srobj = scope[scope.length - 1];
    const result: any = srobj[methodName](...args);
  };
};

/** call method for object on the scope stack  */
const propRef = (propName): SMOpExec => {
  /* TODO: SM_Objects and Agents need to have the same prop/method interface */
  return (agent: Agent, stack: SM_Object[], scope: SMScopeRef[]) => {
    const srobj: SMScopeRef = scope[scope.length - 1];
  };
};

/// DEBUG OPCODE //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const dbgStack = (): SMOpExec => {
  return (agent, stack) => {
    console.log(`stack: ${JSON.stringify(stack)}`);
  };
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// stackmachine opcodes
export {
  // stack manipulation
  pushVar,
  pushProp,
  pop,
  popPropValue,
  // immediate
  setPropValue,
  // stack indirect
  refReturn,
  refProp,
  callRef,
  propRef,
  dbgStack
};
