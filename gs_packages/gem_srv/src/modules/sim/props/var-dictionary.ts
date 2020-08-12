/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The DictionaryProp class is a key/value store for other GVar properties

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import SM_Object from '../lib/class-sm-object';
import { I_Scopeable } from '../types/t-smc';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class DictionaryProp extends SM_Object {
  dict: Map<string, I_Scopeable>;
  constructor(name: string) {
    super(name);
    this.meta.type = Symbol.for('DictionaryProp');
    this.meta.name = name;
    this.dict = new Map();
  }
  addItem(key: string, gvar: I_Scopeable) {
    if (this.dict.has(key)) throw Error(`key ${key} already exists`);
    if (gvar instanceof SM_Object) this.dict.set(key, gvar);
    else throw Error(`value to set must be GVar, not typeof ${typeof gvar}`);
  }
  getItem(key: string): I_Scopeable {
    return this.dict.get(key);
  }
  has(key: string): boolean {
    return this.dict.has(key);
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default DictionaryProp;
