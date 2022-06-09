/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The SM_Dictionary class is a key/value store for other GVar properties

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import SM_Object from 'lib/class-sm-object';
// uses types defined in t-script.d
import { RegisterVarCTor } from 'modules/datacore';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class SM_Dictionary extends SM_Object {
  dict: Map<string, ISM_Object>;
  constructor(name: string) {
    super(name);
    this.meta.type = Symbol.for('SM_Dictionary');
    this.meta.name = name;
    this.dict = new Map();
  }
  addItem(key: string, gvar: ISM_Object) {
    if (this.dict.has(key)) throw Error(`key ${key} already exists`);
    if (gvar instanceof SM_Object) this.dict.set(key, gvar);
    else throw Error(`value to set must be GVar, not typeof ${typeof gvar}`);
  }
  updateItem(key: string, gvar: ISM_Object) {
    if (gvar instanceof SM_Object) this.dict.set(key, gvar);
    else throw Error(`value to set must be GVar, not typeof ${typeof gvar}`);
  }
  getItem(key: string): ISM_Object {
    return this.dict.get(key);
  }
  has(key: string): boolean {
    return this.dict.has(key);
  }
  getKeys(): string[] {
    return Array.from(this.dict.keys());
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see class export above
RegisterVarCTor('Dictionary', SM_Dictionary);
