/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Testing Commands

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
const jitterAgent = (): TOpcode => {
  return (agent: IAgent): TOpWait => {
    const rx = Math.round(5 - Math.random() * 10);
    const ry = Math.round(5 - Math.random() * 10);
    const x = agent.x() + rx;
    const y = agent.y() + ry;
    agent.prop('x')._value = x;
    agent.prop('y')._value = y;
  };
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// built-in props
export { jitterAgent };
