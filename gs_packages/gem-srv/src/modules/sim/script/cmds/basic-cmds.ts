/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Basic Script Commands, built from basic opcodes.

  REMEMBER: this generates STACK MACHINE CODE so you have to be
  thinking in terms of agent operations happening in that context.
  These functions do not return values programmatically.

  If you need to do that, you can just call them directly on the
  agents themselves in regular Javascript.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { IAgent, IScopeable, TOpcode, TOpWait } from 'lib/t-smc';
import { setAgentPropValue } from 'modules/sim/script/ops/basic-ops';

/// AGENT DEFINITION STAGE ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Direct set built-in properties common to all agents */
const setX = (num: number): TOpcode[] => [setAgentPropValue('x', num)];
const setY = (num: number): TOpcode[] => [setAgentPropValue('y', num)];
const setSkin = (path: string): TOpcode[] => [setAgentPropValue('skin', path)];

/** Direct set property with passed property object */
const defineAgentProp = (propName: string, prop: IScopeable): TOpcode => {
  return (agent: IAgent): TOpWait => {
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
