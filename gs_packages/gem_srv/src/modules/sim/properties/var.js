/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The GSVar class provides uniqueIds for each variable in the system.
  Extends GSBase

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import GSBase from '../agents/class-base';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class GSVar extends GSBase {
  constructor(initialValue) {
    super(initialValue);
    this.meta = {
      type: Symbol.for('GSVar')
    };
  }
  // get/set _value defined in base class
  // serialize() is defined in base class
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default GSVar;
