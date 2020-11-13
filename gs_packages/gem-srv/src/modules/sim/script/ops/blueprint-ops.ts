/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Agent Templating Stack Machine Operations
  see stack-ops.ts for description of stack machine

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { IAgent, TOpcode, TOpWait, IScopeable } from 'lib/t-script';

/// AGENT TEMPLATE ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const addProp = (
  name: string,
  PropTypeCTor: { new (...args): IScopeable },
  initValue: any
): TOpcode => {
  return (agent: IAgent): TOpWait => {
    agent.addProp(name, new PropTypeCTor(initValue));
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
