/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Testing Commands

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { IAgent, IScopeable, TOpcode, TOpWait } from 'lib/t-script';
import { setAgentPropValue } from 'script/ops/stack-ops';

/// AGENT DEFINITION STAGE ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Direct set built-in properties common to all agents */
const setX = (num: number): TOpcode[] => [setAgentPropValue('x', num)];
const setY = (num: number): TOpcode[] => [setAgentPropValue('y', num)];
const setSkin = (path: string): TOpcode[] => [setAgentPropValue('skin', path)];

/** Direct set property with passed property object */
const jitterAgent = (): TOpcode => {
  const mag = 5;
  const mag2 = mag / 2;
  return (agent: IAgent): TOpWait => {
    const rx = Math.round(mag2 - Math.random() * mag);
    const ry = Math.round(mag2 - Math.random() * mag);
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
