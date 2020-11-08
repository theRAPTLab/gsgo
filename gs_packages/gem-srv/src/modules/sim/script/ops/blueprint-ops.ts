/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Agent Templating Stack Machine Operations
  see stack-ops.ts for description of stack machine

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { IAgent, TOpcode, TOpWait, IScopeable } from 'lib/t-smc';

/// AGENT TEMPLATE ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const addProp = (
  name: string,
  PropTypeCTor: { new (...args): IScopeable }
): TOpcode => {
  return (agent: IAgent): TOpWait => {
    const prop = new PropTypeCTor(name);
    console.log('need to check for initial value');
    agent.addProp(name, new PropTypeCTor(name));
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const addFeature = (name: string): TOpcode => {
  return (agent: IAgent): TOpWait => {
    agent.addFeature(name);
  };
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// debug opcodes
export { addProp, addFeature };
