/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  StackMachine Operations

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Agent from './class-agent';
import GVar from '../properties/var';
import GAgent from '../properties/var-agent';
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// TYPE DECLARATIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
interface SMScopeRef {
  opExec: (name: string, stack: GVar[]) => GVar;
  method: (name: string, ...args: any) => any;
  prop: (name: string) => GVar;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type SMOpStatus = Promise<any> | void;
type SMOpExec = (
  agent: Agent,
  stack?: GVar[],
  scope?: SMScopeRef[]
) => SMOpStatus;
type SMProgram = SMOpExec[];

/// OPERATIONS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** push a GVar argument onto the stack for subsequent ops */
function pushVar(gv: GVar): SMOpExec {
  return (agent: Agent, stack: GVar[]) => {
    stack.push(gv);
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Get the prop from agent and push it on the stack */
function pushProp(propName: string): SMOpExec {
  return (agent: Agent, stack: GVar[]) => {
    stack.push(agent.prop(propName).value);
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function pop(): SMOpExec {
  return (agent: Agent, stack: GVar[]) => {
    stack.pop();
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Set prop from immediatee */
function setPropValue(propName: string, value: any): SMOpExec {
  return (agent: Agent) => {
    const prop = agent.prop(propName);
    const old = prop.value;
    prop.value = value;
    if (DBG) console.log(`set ${agent.name()}.${propName}=${value} (was ${old})`);
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Pop prop from stack, and set agent prop to its value */
function popPropValue(propName: string): SMOpExec {
  return (agent: Agent, stack: GVar[]) => {
    const value = stack.pop().value;
    agent.prop(propName).value = value;
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** remove a scope object from the scope stack */
function refPop(): SMOpExec {
  return (agent: Agent, stack: GVar[], scope: SMScopeRef[]) => {
    scope.pop();
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** add agent prop to scope stack */
function refProp(propName): SMOpExec {
  return (agent: Agent, stack: GVar[], scope: SMScopeRef[]) => {
    const prop = agent.prop(propName);
    scope.push(prop);
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** add agent to scope stack */
function refAgent(agent: Agent): SMOpExec {
  return (agent: Agent, stack: GVar[], scope: SMScopeRef[]) => {
    const ga = new GAgent(agent);
    console.log('unimplemented');
  };
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** call method for object on the scope stack  */
function scopedCall(methodName: string, ...args: any[]): SMOpExec {
  /* TODO: GVars and Agents need to have the same prop/method interface */
  return (agent: Agent, stack: GVar[], scope: SMScopeRef[]) => {
    const srobj = scope[scope.length - 1];
    const result: any = srobj[methodName](...args);
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** call method for object on the scope stack  */
function scopedProp(propName): SMOpExec {
  /* TODO: GVars and Agents need to have the same prop/method interface */
  return (agent: Agent, stack: GVar[], scope: SMScopeRef[]) => {
    const srobj = scope[scope.length - 1];
    const prop = srobj;
    stack.push(prop);
  };
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function dbgStack(): SMOpExec {
  return (agent, stack) => {
    console.log(`stack: ${JSON.stringify(stack)}`);
  };
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  // types
  SMProgram,
  SMScopeRef,
  SMOpExec,
  SMOpStatus,
  // operations
  setPropValue,
  pushVar,
  pushProp,
  pop,
  popPropValue,
  refPop,
  refProp,
  refAgent,
  scopedCall,
  scopedProp,
  // debug ops
  dbgStack
};
