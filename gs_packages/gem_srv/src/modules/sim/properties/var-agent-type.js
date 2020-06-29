/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The GSAgentType class manages all Agent Templates.
  An Agent Type is a type.
  An Agent Template is a named function that creates an agent instance.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import GSVar from './var';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class GSAgentType extends GSVar {
  constructor(templateName) {
    super();
    this.meta.type = Symbol.for('GSAgentType');
    if (!GSVar.IsAgentString(templateName)) throw Error('not a valid agent name');
    this.value = templateName;
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default GSAgentType;
