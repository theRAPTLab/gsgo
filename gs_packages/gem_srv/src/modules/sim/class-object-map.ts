/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  A Lookup Dictionary of Named Entities of type T
  Used to store objects by name and look-em-up later

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { Agent, AnyFunction, AgentTemplateFunction } from './type-defs';
import { IsString, HasMeta, HasKey, GetKey, SaveKey } from './type-checks';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class ObjectMap<T> {
  //
  protected mapType: symbol;
  protected dict: Map<string, T>;
  //
  constructor(uniqLabel: string) {
    if (!IsString(uniqLabel)) throw Error('arg1 must be string');
    this.mapType = Symbol.for(uniqLabel);
    this.dict = new Map(); // of Sets
  }

  /** return the string type for this ObjectMap */
  type(): string {
    return Symbol.keyFor(this.mapType);
  }

  /** return the object associated with key */
  get(key: string) {
    return GetKey(this.dict, key);
  }

  /** return true if category has object */
  has(key: string): boolean {
    return IsString(key) && HasKey(this.dict, key);
  }

  /** add object to category set */
  set(key: string, obj: T): void {
    if (!HasMeta(obj)) throw Error('obj does not have valid meta prop');
    SaveKey(this.dict, key, obj);
  }

  /** non-typescript create Array Map */
  static CreateArrayMap(uniqLabel: string): ObjectMap<object[]> {
    return new ObjectMap<object[]>(uniqLabel);
  }
  static CreateFunctionMap(uniqLabel: string): ObjectMap<AnyFunction> {
    return new ObjectMap<AnyFunction>(uniqLabel);
  }
} // end of ObjectMap<T>

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default ObjectMap;
