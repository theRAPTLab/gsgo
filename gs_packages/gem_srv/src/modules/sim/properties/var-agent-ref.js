/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The GSAgentRef class manages Agent Type Names, which are a kind of string.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import GSVar from './var';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class GSAgentRef extends GSVar {
  constructor(agentType) {
    super();
    this.meta.type = Symbol.for('GSAgentRef');
    //
    if (!GSVar.IsAgentString(agentType)) throw Error('not a valid agent name');
    this.value = agentType;
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default GSAgentRef;
