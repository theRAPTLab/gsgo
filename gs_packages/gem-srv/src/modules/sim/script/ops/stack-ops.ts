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
  IAgent,
  TStackable,
  IScopeable,
  IState,
  TOpcode,
  TOpWait
} from 'lib/t-script';
import SM_Object from 'lib/class-sm-object';

/// STACK OPCODES /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** push object (usually a prop or agent) on stack */
const push = (gv: TStackable): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    STATE.stack.push(gv);
  };
};
/** discard values from stack (default 1) */
const pop = (num: Number = 1): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    for (let i = 0; i < num; i++) STATE.stack.pop();
  };
};
/** duplicate top of stack */
const dupe = (): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    STATE.stack.push(STATE.peek());
  };
};
/** push agent on stack */
const pushAgent = (): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    STATE.stack.push(agent);
  };
};
/** push agent.prop on stack */
const pushAgentProp = (propName: string): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    STATE.stack.push(agent.getProp(propName));
  };
};
/** push agent.prop.value on stack */
const pushAgentPropValue = (propName: string): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    STATE.stack.push(agent.getProp(propName).value);
  };
};
/** Pop object from stack, read its value, then assign to agent.prop
 */
const popAgentPropValue = (propName: string): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const element = STATE.pop();
    if (element instanceof SM_Object) {
      agent.getProp(propName).value = element.value;
    } else {
      agent.getProp(propName).value = element;
    }
  };
};

/// IMMEDIATE OPCODES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Directly set agent prop with immediate value */
const setAgentPropValue = (propName: string, value: any): TOpcode => {
  return (agent: IAgent): TOpWait => {
    const prop = agent.getProp(propName);
    prop.value = value;
  };
};
/** There is no getAgentPropValue. Use popAgentPropValue */

/// STACK INDIRECT OPCODES ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Move top of scope stack to data stack.
 */
const scopeToStack = (): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const { scope, stack } = STATE;
    stack.push(scope.pop() as TStackable);
  };
};
/** Move top of stack to scope stack, with checks */
const stackToScope = (): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const { scope, stack } = STATE;
    const obj = stack.pop();
    if (obj instanceof SM_Object) scope.push(obj as IScopeable);
    else throw Error('stackToScope can not move non-SM_Object');
  };
};
/** remove an object from the scope stack */
const scopePop = (): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    STATE.scope.pop();
  };
};
/** push the named agent prop on the scope stack */
const agentPropToScope = (propName: string): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const prop = agent.getProp(propName);
    // console.log('prop', agent.name(), '.', agent.getProp(propName));
    STATE.scope.push(prop);
  };
};
/** push the agent on the scope stack */
const agentToScope = (): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    STATE.scope.push(agent);
  };
};
/** push an agent's feature on the scope stack */
const agentFeatureToScope = (featName: string): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    STATE.scope.push(agent);
    STATE.scope.push(agent.getFeature(featName));
  };
};
/** Retrieve prop from scoped object, and push it on stack. */
const scopedProp = (propName: string): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const { scope, stack } = STATE;
    const SOBJ: TStackable = scope[scope.length - 1];
    stack.push(SOBJ.getProp(propName));
  };
};
/** Retrieve prop.value from scoped object, and push it on stack. */
const scopedPropValue = (propName: string): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const { scope, stack } = STATE;
    const SOBJ: TStackable = scope[scope.length - 1];
    stack.push(SOBJ.getProp(propName).value);
  };
};
/** Invoke method() from scoped object, return onto stack
 *  This is like a subroutine.
 *  Any method name and an arbitrary number of argument are passed,
 *  and any results are pushed on the datastack.
 */
const scopedMethod = (methodName: string, ...args: any[]): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const { scope, stack } = STATE;
    const SOBJ = scope[scope.length - 1];
    // call the method, which is also a stackmachine program
    // the results of the method, if any, are returned as a stack
    // so we need to push this onto the existing stack
    const RSTACK: TStackable = SOBJ.getMethod(methodName)(...args);
    // push elements returned from scoped call onto our stack
    stack.push(RSTACK);
  };
};
/** Invoke function property on scoped object, return onto stack */
const scopedFunction = (funcName: string, ...args: any[]): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const { scope, stack } = STATE;
    const SOBJ: IScopeable = scope[scope.length - 1];
    // call the function property on the scoped object
    const RSTACK = SOBJ[funcName](...args);
    // push elements returned from scoped call onto our stack
    stack.push(RSTACK);
  };
};
/** Invoke a feature's scoped context by **including agent** */
const scopedFunctionWithAgent = (funcName: string, ...args: any[]): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const { scope, stack } = STATE;
    const SOBJ = scope[scope.length - 1];
    // call the function property on the scoped object
    const RSTACK: TStackable = SOBJ[funcName](agent, ...args);
    // push elements returned from scoped call onto our stack
    stack.push(RSTACK);
  };
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// data stack ops
export { push, pushAgent, pushAgentProp, pop, dupe };
export { pushAgentPropValue, popAgentPropValue };
/// agent direct ops
export { setAgentPropValue };
/// stack utility ops
export { stackToScope, scopeToStack };
/// scope stack ops
export { agentToScope, agentPropToScope, agentFeatureToScope, scopePop };
/// scoped invocation ops
export { scopedMethod, scopedFunction, scopedProp, scopedPropValue };
/// scoped feature ops
export { scopedFunctionWithAgent };
