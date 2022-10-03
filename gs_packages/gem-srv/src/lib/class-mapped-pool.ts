/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Object MappedPool (WIP)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

// uses types from t-pool.d
import Pool from './class-pool';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// MODULE HELPERS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_CheckConf(config: MapFunctions) {
  if (typeof config !== 'object') throw Error('arg1 is not config object');
  if (typeof config.onAdd !== 'function')
    throw Error('bad declaration for onAdd');
  if (typeof config.shouldAdd !== 'function')
    throw Error('bad declaration for shouldAdd');
  if (typeof config.onUpdate !== 'function')
    throw Error('bad declaration for onUpdate');
  if (typeof config.onRemove !== 'function')
    throw Error('bad declaration for onRemove');
  if (typeof config.shouldRemove !== 'function')
    throw Error('bad declaration for shouldRemove');
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
  ifAdd: TestFunction;
  pool: Pool;
  seen_sobjs: Map<any, IPoolable>;
  deltas: ISyncResults;

  constructor(pool: Pool, conf: MapFunctions) {
    // ensure that constructor has full complement of functions
    this.setMapFunctions(m_CheckConf(conf));
    this.pool = pool;
    this.seen_sobjs = new Map();
    // clear the pool just in case
    if (this.pool.allocatedCount() > 0) {
      console.warn(`${this.pool.name()} pool was reused (old data lost)`);
      this.pool.reset();
    }
  }

  setMapFunctions(conf: MapFunctions) {
    // we allow partial updates to MapFunctions
    const { onAdd, shouldAdd, onUpdate, onRemove, shouldRemove } = conf;
    if (typeof onAdd === 'function') this.cbAdder = onAdd;
    if (typeof shouldAdd === 'function') this.ifAdd = shouldAdd;
    if (typeof onUpdate === 'function') this.cbUpdater = onUpdate;
    if (typeof shouldRemove === 'function') this.ifRemove = shouldRemove;
    if (typeof onRemove === 'function') this.cbRemover = onRemove;
  }

  /** 1. given source map, do the obj.id mapping to our pool
   *     or use syncFromArray below. This sets up the
   *     delta arrays added, updated, removed
   *     Process the arrays through filtering functions with mapObjects()
   */
  syncFromMap(srcMap: PoolableMap) {
    const sobjs = [...srcMap.values()];
    // build update and add array by iterated over source objects
    this.seen_sobjs.clear(); // track ids that were added up updated
    const updated = [];
    const added = [];
    sobjs.forEach(sobj => {
      if (this.pool.has(sobj.id)) updated.push(sobj);
      else if (this.ifAdd(sobj, srcMap)) added.push(sobj);
      this.seen_sobjs.set(sobj.id, sobj);
    });
    // build remove array by iterating over allocated objects
    const removed = this.pool
      .getAllocated() // get array of in-use pool objects
      .filter(
        poolObj =>
          !srcMap.has(poolObj.id) && this.ifRemove(poolObj, this.seen_sobjs)
      );
    // return lists of what was done
    this.deltas = { added, updated, removed };
    return this.deltas;
  }

  /** 1. given source array, do the obj.id mapping to our pool
   *  or use syncFromMap above. This sets up the delta arrays added,
   *  updated, removed.
   *  Process the arrays through filtering functions with mapObjects()
   */
  syncFromArray(sobjs: PoolableArray) {
    // build update and add array by iterated over source objects
    this.seen_sobjs.clear(); // track ids that were added up updated
    const updated = [];
    const added = [];
    sobjs.forEach(sobj => {
      if (this.pool.has(sobj.id)) {
        // if (DBG) console.log(this.pool.name(), sobj.id, 'updated');
        updated.push(sobj);
        this.seen_sobjs.set(sobj.id, sobj);
      } else if (this.ifAdd(sobj)) {
        added.push(sobj);
        if (DBG) console.log(this.pool.name(), sobj.id, 'added');
        this.seen_sobjs.set(sobj.id, sobj);
      } else if (DBG) console.log(this.pool.name(), sobj.id, 'not added');
    });
    // build remove array by iterating over allocated objects
    /*/ REMOVE ARRAYS
        run over the entire array of already-allocatead things in
        the pool.
        see if we've seenit.
    /*/
    const removed = [];
    const pobjs = this.pool.getAllocated();
    // get all the objects that are already allocated
    pobjs.forEach((pobj, i) => {
      const sobjGone = !this.seen_sobjs.has(pobj.id);
      const yesRemove = this.ifRemove(pobj, this.seen_sobjs);
      if (sobjGone && yesRemove) {
        if (DBG) console.warn(this.pool.name(), pobj.id, 'removed');
        removed.push(pobj); // will be deleted in
      }
    });
    // added and updated will contain source objs
    // removed will contain "deleted" pool objects
    this.deltas = { added, updated, removed };
    return this.deltas;
  }

  /** 2. Using the current set of differencs arrays, run the
   *  filtering functions as needed
   */
  mapObjects() {
    if (!this.deltas) return;
    const { updated, added, removed } = this.deltas;
    // process all through the appropriate function
    updated.forEach(sobj => {
      const dobj = this.pool.get(sobj.id);
      this.cbUpdater(sobj, dobj);
    });
    added.forEach(sobj => {
      const dobj = this.pool.allocateId(sobj.id);
      this.cbAdder(sobj, dobj);
    });
    removed.forEach(dobj => {
      this.cbRemover(dobj);
      this.pool.deallocate(dobj);
    });
    this.deltas = undefined;
  }

  getMappedObjects() {
    return this.pool.getAllocated();
  }
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// above functions, classes are exported
