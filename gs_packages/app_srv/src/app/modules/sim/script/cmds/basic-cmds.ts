/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Basic Script Commands, built from basic opcodes.

  REMEMBER: this generates STACK MACHINE CODE so you have to be
  thinking in terms of agent operations happening in that context.
  These functions do not return values programmatically.

  If you need to do that, you can just call them directly on the
  agents themselves in regular Javascript.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { I_Agent, I_Scopeable, T_Opcode, T_OpWait } from '../../types/t-smc';
import { setAgentPropValue } from '../ops/basic-ops';

/// AGENT DEFINITION STAGE ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Direct set built-in properties common to all agents */
const setX = (num: number): T_Opcode[] => [setAgentPropValue('x', num)];
const setY = (num: number): T_Opcode[] => [setAgentPropValue('y', num)];
const setSkin = (path: string): T_Opcode[] => [setAgentPropValue('skin', path)];

/** Direct set property with passed property object */
const defineAgentProp = (propName: string, prop: I_Scopeable): T_Opcode => {
  return (agent: I_Agent): T_OpWait => {
    agent.addProp(propName, prop);
  };
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// built-in props
export {
  setX, // num
  setY, // num
  setSkin, // string
  defineAgentProp // propname, prop
};
