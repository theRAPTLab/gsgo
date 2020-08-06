/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Agent Templating Stack Machine Operations
  see basic-ops.ts for description of stack machine

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { T_Agent, T_Opcode, T_OpWait, T_Scopeable } from '../../types/t-smc';

/// AGENT TEMPLATE ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const addProp = (name: string, gv: T_Scopeable): T_Opcode => {
  return (agent: T_Agent): T_OpWait => {
    agent.addProp(name, gv);
  };
};
const addFeature = (name: string): T_Opcode => {
  return (agent: T_Agent): T_OpWait => {
    agent.addFeature(name);
  };
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// debug opcodes
export { addProp, addFeature };
