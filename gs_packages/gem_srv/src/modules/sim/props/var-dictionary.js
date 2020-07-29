/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The DictionaryProp class is a key/value store for other GVar properties

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import SM_Object from '../lib/class-SM_Object';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class DictionaryProp extends SM_Object {
  constructor(name) {
    super();
    this.meta.type = Symbol.for('DictionaryProp');
    this.meta.name = name;
    this.dict = new Map();
  }
  addProp(key, gvar) {
    if (this.dict.has(key)) throw Error(`key ${key} already exists`);
    if (gvar instanceof SM_Object) this.dict.set(key, gvar);
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
export default DictionaryProp;
