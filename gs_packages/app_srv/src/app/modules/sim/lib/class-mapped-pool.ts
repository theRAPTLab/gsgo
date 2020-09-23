/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Object MappedPool (WIP)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Pool, { IPoolable } from './class-pool';

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export type PoolableMap = Map<any, IPoolable>;
export type PoolableSet = Set<IPoolable>;
export type PoolableArray = IPoolable[];

export type TestFunction = (obj: any) => boolean;
export type AddFunction = (srcObj: IPoolable, newObj: IPoolable) => void;
export type UpdateFunction = (srcObj: IPoolable, updateObj: IPoolable) => void;
export type RemoveFunction = (removeObj: IPoolable) => void;

export interface SyncFunctions {
  onAdd?: AddFunction;
  onUpdate?: UpdateFunction;
  shouldRemove?: TestFunction;
  onRemove?: RemoveFunction;
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
export function TestArrayEntities(arr: any[]): boolean {
  const numBadObjs = arr.reduce((acc: number, obj: any) => {
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
    // ensure that constructor has full complement of functions
    this.setObjectHandlers(m_CheckConf(conf));
    this.pool = pool;
    // clear the pool just in case
    if (this.pool.allocatedCount() > 0) {
      console.warn(`${this.pool.name()} pool was reused (old data lost)`);
      this.pool.reset();
    }
  }

  setObjectHandlers(conf: SyncFunctions) {
    // we allow partial updates to SyncFunctions
    const { onAdd, onUpdate, onRemove, shouldRemove } = conf;
    if (typeof onAdd === 'function') this.cbAdder = onAdd;
    if (typeof onUpdate === 'function') this.cbUpdater = onUpdate;
    if (typeof shouldRemove === 'function') this.ifRemove = shouldRemove;
    if (typeof onRemove === 'function') this.cbRemover = onRemove;
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
