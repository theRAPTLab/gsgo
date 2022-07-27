/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  NOTE: THESE ARE EARLY EXAMPLES USED TO DESIGN THE SCRIPT ENGINE
  AND THEN IT TURNED OUT WE DIDN'T NEED THESE OPCODES AT ALL

  Stack Machine (SM) Agent Opcodes

  These opcodes manipulate agent instances by (1) calling agent methods
  (2) manipulating agent property values or (3) using the stack to
  move values between properties

  ---

  A StackMachine opcode is a higher order function returning
  a function that receives an agent instance and a stack, scope, and
  conditions object. This function is the "compiled" output of the
  operation.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import SM_Object from 'lib/class-sm-object';

/// TYPE DEFINITIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type SM_Ctor = { new (...args): ISM_Object };

/// AGENT TEMPLATE ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function addProp(
  name: string,
  PropTypeCTor: SM_Ctor,
  initValue: any
): TOpcode {
  return (agent: IAgent): void => {
    agent.addProp(name, new PropTypeCTor(initValue));
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function addFeature(name: string): TOpcode {
  return (agent: IAgent): void => {
    agent.addFeature(name);
  };
}

/// AGENT IMMEDIATE OPCODES ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Directly set agent prop with immediate value */
export function setAgentPropValue(propName: string, value: any) {
  return (agent: IAgent): void => {
    const prop = agent.getProp(propName);
    prop.value = value;
  };
}
/** There is no getAgentPropValue. Use popAgentPropValue */

/// AGENT STACK OPS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** push agent on stack */
export function pushAgent() {
  return (agent: IAgent, STATE: IState): void => {
    STATE.stack.push(agent);
  };
}
/** push agent.prop on stack */
export function pushAgentProp(propName: string) {
  return (agent: IAgent, STATE: IState): void => {
    STATE.stack.push(agent.getProp(propName));
  };
}
/** push agent.prop.value on stack */
export function pushAgentPropValue(propName: string) {
  return (agent: IAgent, STATE: IState): void => {
    STATE.stack.push(agent.getProp(propName).value);
  };
}
/** Pop object from stack, then read value to agent.prop */
export function popAgentPropValue(propName: string) {
  return (agent: IAgent, STATE: IState): void => {
    const element = STATE.pop();
    if (element instanceof SM_Object) {
      agent.getProp(propName).value = element.value;
    } else {
      agent.getProp(propName).value = element;
    }
  };
}
