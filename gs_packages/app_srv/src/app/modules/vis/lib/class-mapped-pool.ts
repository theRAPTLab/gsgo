/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Object MappedPool

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Pool from './class-pool';

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
interface Mappable {
  id: number; // all mappable objects MUST have a numeric id
}
type AnyMap = Map<any, Mappable>;
type ObjectTest = (obj: any) => boolean;
type MapFunction = (key: any, source?: AnyMap, mapped?: AnyMap) => void;

export interface SyncOptions {
  testRemove: ObjectTest;
  funcAdd: MapFunction;
  funcUpdate: MapFunction;
  funcRemove: MapFunction;
}

/// MODULE HELPERS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Looks for differences between two dictionaries 'source' and 'mapped'
 *  containing objects that have a number id property. Runs a function for
 *  each case.
 *  Returns { added, updated, removed } arrays.
 */
export function DiffMaps(source: AnyMap, mapped: AnyMap, opt: SyncOptions) {
  // extract custom handler functions
  const { testRemove, funcAdd, funcUpdate, funcRemove } = opt;

  // algorithm:
  // keys in mapped and not in source are deleted if opt.removeTest() passes
  // keys in source and not in mapped are added
  // keys in mapped and source are updated
  const skeys = [...source.keys()];
  const mkeys = [...mapped.keys()];
  // simple filters
  const arr_update = skeys.filter(key => mkeys.includes(key));
  const arr_add = skeys.filter(key => !mkeys.includes(key));
  // tricky filter: remove if source doesn't have key
  // AND if removeTest agrees that it should be removed
  const arr_remove = mkeys.filter(
    key => !skeys.includes(key) && testRemove(mapped.get(key))
  );
  // process all through the appropriate function
  arr_add.forEach(key => funcAdd(key, source, mapped));
  arr_remove.forEach(key => funcRemove(key, source, mapped));
  arr_update.forEach(key => funcUpdate(key, source, mapped));
  // return lists of what was done
  return { added: arr_add, updated: arr_update, removed: arr_remove };
}

/// LOCAL TYPES ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// MAPPER CLASS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 */
export default class MappedPool {
  fAdd: MapFunction;
  fUpdate: MapFunction;
  fRemove: MapFunction;
  tRemove: ObjectTest;
  pool: Pool;

  constructor(pool: Pool, config: SyncOptions) {
    const { funcAdd, funcUpdate, funcRemove, testRemove } = config;
    this.fAdd = funcAdd;
    this.fUpdate = funcUpdate;
    this.fRemove = funcRemove;
    this.tRemove = testRemove;
    this.pool = pool;
  }

  /** given source, destination, and key to sync, do the mapping */
  sync(srcMap: AnyMap, dstMap: AnyMap, syncKey: any) {
    const skeys = [...srcMap.keys()];
    const mkeys = [...dstMap.keys()];
    // simple filters
    const arr_update = skeys.filter(key => mkeys.includes(key));
    const arr_add = skeys.filter(key => !mkeys.includes(key));
    // tricky filter: remove if source doesn't have key
    // AND if removeTest agrees that it should be removed
    const arr_remove = mkeys.filter(
      key => !skeys.includes(key) && this.tRemove(dstMap.get(key))
    );
    // process all through the appropriate function
    arr_add.forEach(key => this.fAdd(key, srcMap, dstMap));
    arr_remove.forEach(key => this.fRemove(key, srcMap, dstMap));
    arr_update.forEach(key => this.fUpdate(key, srcMap, dstMap));
    // return lists of what was done
    return { added: arr_add, updated: arr_update, removed: arr_remove };
  }
}
