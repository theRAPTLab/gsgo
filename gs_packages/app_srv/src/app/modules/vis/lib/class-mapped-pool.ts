/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Object MappedPool (WIP)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Pool, { I_Poolable } from './class-pool';

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type PoolableMap = Map<any, I_Poolable>;
type PoolableSet = Set<I_Poolable>;
type PoolableArray = I_Poolable[];

type TestFunction = (obj: any) => boolean;
type AddFunction = (srcObj: I_Poolable, newObj: I_Poolable) => I_Poolable;
type UpdateFunction = (srcObj: I_Poolable, updateObj: I_Poolable) => I_Poolable;
type RemoveFunction = (removeObj: I_Poolable) => I_Poolable;

export interface SyncFunctions {
  onAdd: AddFunction;
  onUpdate: UpdateFunction;
  shouldRemove: TestFunction;
  onRemove: RemoveFunction;
}

/// MODULE HELPERS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_CheckConf(config: SyncFunctions) {
  if (typeof config !== 'object') throw Error('arg1 is not config object');
  if (typeof config.onAdd !== 'function') throw Error('config missing onAdd');
  if (typeof config.onUpdate !== 'function')
    throw Error('config missing onUpdate');
  if (typeof config.onRemove !== 'function')
    throw Error('config missing onRemove');
  if (typeof config.shouldRemove !== 'function')
    throw Error('config missing shouldRemove');
  return config;
}
/// TESTING UTILITIES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function TestMapEntities(map: Map<any, any>) {
  const objs = [...map.values()];
  objs.filter(obj => obj.id !== undefined);
  const hasId = objs.length === 0; // true if objs have id prop
  return hasId;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function TestArrayEntities(arr) {
  const numBadObjs = arr.reduce((acc, obj) => {
    return acc + obj.id === undefined ? 1 : 0;
  });
  const goodIds = numBadObjs === 0; // true if objs have id prop
  return goodIds;
}

/// MAPPER CLASS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 */
export default class MappedPool {
  cbAdder: AddFunction;
  cbUpdater: UpdateFunction;
  cbRemover: RemoveFunction;
  ifRemove: TestFunction;
  pool: Pool;

  constructor(pool: Pool, conf: SyncFunctions) {
    const { onAdd, onUpdate, onRemove, shouldRemove } = m_CheckConf(conf);
    this.cbAdder = onAdd;
    this.cbUpdater = onUpdate;
    this.cbRemover = onRemove;
    this.ifRemove = shouldRemove;
    this.pool = pool;
  }

  /** given source map, do the obj.id mapping to our pool */
  syncFromMap(srcMap: PoolableMap) {
    const sobjs = [...srcMap.values()];

    // build update and add array by iterated over source objects
    const arr_update = [];
    const arr_add = [];
    sobjs.forEach(sobj => {
      if (this.pool.has(sobj.id)) arr_update.push(sobj);
      else arr_add.push(sobj);
    });
    // build remove array by iterating over allocated objects
    const arr_remove = this.pool
      .getAllocated() // get array of in-use pool objects
      .filter(poolObj => !srcMap.has(poolObj.id) && this.ifRemove(poolObj));

    // process all through the appropriate function
    arr_update.forEach(sobj => {
      const dobj = this.pool.get(sobj.id);
      this.cbUpdater(sobj, dobj);
    });
    arr_add.forEach(sobj => {
      const dobj = this.pool.allocateId(sobj.id);
      this.cbAdder(sobj, dobj);
    });
    arr_remove.forEach(dobj => {
      this.cbRemover(dobj);
      this.pool.deallocate(dobj);
    });
    // return lists of what was done
    return { added: arr_add, updated: arr_update, removed: arr_remove };
  }

  /** given source array, do the obj.id mapping to our pool */
  syncFromArray(sobjs: PoolableArray) {
    // build update and add array by iterated over source objects
    const seen_sobjs = new Set(); // track ids that were added up updated
    const arr_update = [];
    const arr_add = [];
    sobjs.forEach(sobj => {
      if (this.pool.has(sobj.id)) arr_update.push(sobj);
      else arr_add.push(sobj);
      seen_sobjs.add(sobj.id);
    });
    // build remove array by iterating over allocated objects
    const arr_remove = [];
    const pobjs = this.pool.getAllocated();
    // get all the objects that are already allocated
    pobjs.forEach(pobj => {
      const sobjGone = !seen_sobjs.has(pobj.id);
      const yesRemove = this.ifRemove(pobj);
      if (sobjGone && yesRemove) arr_remove.push(pobj);
    });
    // process all through the appropriate function
    arr_update.forEach(sobj => {
      const dobj = this.pool.get(sobj.id);
      this.cbUpdater(sobj, dobj);
    });
    arr_add.forEach(sobj => {
      const dobj = this.pool.allocateId(sobj.id);
      this.cbAdder(sobj, dobj);
    });
    arr_remove.forEach(dobj => {
      this.cbRemover(dobj);
      this.pool.deallocate(dobj);
    });
    // added and updated will contain source objs
    // removed will contain "deleted" pool objects
    return { added: arr_add, updated: arr_update, removed: arr_remove };
  }

  getSyncedObjects() {
    return this.pool.getAllocated();
  }
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// above functions, classes are exported
