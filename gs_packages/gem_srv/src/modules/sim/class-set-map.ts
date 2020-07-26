/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  A Map that manages Typed Sets

  const SETS = new SetMap<SCMObject>('');

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import ObjectMap from './class-object-map';
import { Agent } from './type-defs';
import { IsString } from './type-checks';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class SetMap<T = any> {
  //
  protected mapType: symbol;
  protected map: ObjectMap<Set<T>>;
  protected dict: Map<string, Set<T>>;
  //
  constructor(uniqLabel: string) {
    if (!IsString(uniqLabel)) throw Error('arg1 must be string');
    this.map = new ObjectMap<Set<T>>(uniqLabel);
  }

  /** return the string type for this SetMap */
  type(): string {
    return this.map.type();
  }

  /** return set associated with key */
  get(key: string): Set<T> {
    return this.map.get(key);
  }

  /** return an array of set members */
  getArray(key: string): T[] {
    return [...this.map.get(key)];
  }

  /** return true if keyagory has object */
  has(key: string, obj: T): boolean {
    return this.map.get(key).has(obj);
  }

  /** add object to key set */
  add(key: string, obj: T): T {
    const set = this.map.get(key);
    if (set.has(obj)) throw Error(`set ${key} already has obj`);
    set.add(obj);
    return obj;
  }

  /** non-typescript create AgentMap for instances */
  static CreateAgentInstanceMap(uniqLabel: string): SetMap<Agent> {
    return new SetMap<Agent>(uniqLabel);
  }
} // end of SetMap<T>

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default SetMap;
