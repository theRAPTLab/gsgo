/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The DictionaryProp class is a key/value store for other GVar properties

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import SM_Object from 'lib/class-sm-object';
import { IScopeable } from 'lib/t-smc';
import { RegisterSMObjectCtor } from 'script/keyword-factory';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class DictionaryProp extends SM_Object implements IScopeable {
  dict: Map<string, IScopeable>;
  constructor(name: string) {
    super(name);
    this.meta.type = Symbol.for('DictionaryProp');
    this.meta.name = name;
    this.dict = new Map();
  }
  addItem(key: string, gvar: IScopeable) {
    if (this.dict.has(key)) throw Error(`key ${key} already exists`);
    if (gvar instanceof SM_Object) this.dict.set(key, gvar);
    else throw Error(`value to set must be GVar, not typeof ${typeof gvar}`);
  }
  getItem(key: string): IScopeable {
    return this.dict.get(key);
  }
  has(key: string): boolean {
    return this.dict.has(key);
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see class export above
RegisterSMObjectCtor('Dictionary', DictionaryProp);
