/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Agent Templating Stack Machine Operations
  see basic-ops.ts for description of stack machine

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { IAgent, TOpcode, TOpWait, IScopeable } from '../../lib/t-smc';

/// AGENT TEMPLATE ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const addProp = (
  name: string,
  NewFunc: { new (...args): IScopeable }
): TOpcode => {
  return (agent: IAgent): TOpWait => {
    agent.addProp(name, new NewFunc(name));
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
