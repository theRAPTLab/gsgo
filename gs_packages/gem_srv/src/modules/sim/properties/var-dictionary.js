/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The GSDictionary class is a key/value store for other GVar properties

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import GSVar from './var';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class GSDictionary extends GSVar {
  constructor(name) {
    super();
    this.meta.type = Symbol.for('GSDictionary');
    this.meta.name = name;
    this.dict = new Map();
  }
  addProp(key, gvar) {
    if (this.dict.has(key)) throw Error(`key ${key} already exists`);
    if (gvar instanceof GSVar) this.dict.set(key, gvar);
    else throw Error(`value to set must be GVar, not typeof ${typeof gvar}`);
  }
  prop(key) {
    return this.dict.get(key);
  }
  has(key) {
    return this.dict.has(key);
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default GSDictionary;
