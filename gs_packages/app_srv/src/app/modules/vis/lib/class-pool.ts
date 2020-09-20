/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Object Pool (WIP)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { I_Poolable, I_PoolOptions } from './types-pool';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const DEFAULT_SIZE = 20;
const DEFAULT_BATCH = 10;

/// LOCAL TYPES ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// POOL CLASS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  The POOL class maintains an array of reusable objects, which grows
 *  as necessary. It's useful to avoid expensive allocations of new
 *  objects in tight loops.
 */
class Pool {
  // local stage
  pool_objs: Array<I_Poolable>; // pool of reusable objects
  avail_objs: Array<number>; // array of available indices
  obj_map: Map<number, number>; // Map obj.id to pool_ids
  //
  name: string;
  ManagedClass: () => void; // create an object
  size: number; // current size of pool
  batchSize: number; // batch size (default to 10)
  autoGrow: boolean; // whether to grow or die

  constructor(name: string, opt: I_PoolOptions) {
    //
    this.name = name;
    //
    this.ManagedClass = opt.Constructor;
    this.size = opt.size || DEFAULT_SIZE;
    this.batchSize = opt.batchSize || DEFAULT_BATCH;
    this.autoGrow = opt.autoGrow || false;
    //
    this.pool_objs = [];
    this.avail_objs = [];
    this.setSize();
  }

  /** create a new object from stored ManagedClass constructor */
  makeObject() {
    const o: I_Poolable = new this.ManagedClass();
    const pool_id = this.pool_objs.length; // inc by 1
    // make object.id mappable to pool_id
    o._pool_id = pool_id;
    this.obj_map.set(o.id, pool_id);
    // save new object to pool and make available
    this.pool_objs.push(o);
    this.avail_objs.push(pool_id);
    return o;
  }

  /** set the number of items in the pool */
  setSize(newSize: number = this.size) {
    const pool_size = this.pool_objs.length;
    if (newSize < pool_size) return;
    //
    let addCount = newSize - pool_size;
    if (addCount < this.batchSize) addCount = this.batchSize;
    if (DBG) console.log('adding', addCount, 'objects');
    this.increaseSize(addCount);
  }

  /** add a number of objects to the pool */
  increaseSize(count: number = this.batchSize) {
    if (DBG) console.log('growing by', this.batchSize);
    while (count-- > 0) this.makeObject();
    this.size = this.pool_objs.length;
    if (DBG) console.log('available', JSON.stringify(this.avail_objs));
  }

  /** retrieve an instance from allocation pool */
  allocate() {
    if (this.avail_objs.length < 1) {
      if (this.autoGrow) {
        this.increaseSize(/* default */);
      } else {
        if (DBG) console.log('available', JSON.stringify(this.avail_objs));
        return undefined;
      }
    }
    if (DBG) console.log('available', JSON.stringify(this.avail_objs));
    const index: number = this.avail_objs.shift();
    // retrieve something from the pool
    const o = this.pool_objs[index];
    // remove objId to poolId lookup
    this.obj_map.set(o.id, index);
    // tell object to initialize itself
    o.init();
    o.validate(true);
    return o;
  }

  /** return an instance to the pool */
  deallocate(o: I_Poolable) {
    const poolId = o._pool_id;
    // tell object to clean itself up on removal
    o.dispose();
    o.validate(false);
    // remove objId to poolId lookup
    this.obj_map.delete(o.id);
    // add back to pool
    this.avail_objs.push(poolId);
    if (DBG) console.log('dalloc:avail', JSON.stringify(this.avail_objs));
  }

  /** deallocate an instance by object id (not pool id) */
  deallocateId(objId: number) {
    const poolId = this.obj_map.get(objId); // Map<objId,poolId>

    const o = this.pool_objs[poolId];
    o.dispose();
    o.validate(false);
    this.avail_objs.push(poolId);
    if (DBG) console.log('dallocId:avail', JSON.stringify(this.avail_objs));
  }

  /** return whether an id (not pool_id) is in the pool */
  has(objId: any) {
    // obj_map is Map<objId,poolId>
    return this.obj_map.has(objId);
  }

  /** retrieve an allocated object by id (not pool id) */
  get(objId: number): I_Poolable {
    const index = this.obj_map.get(objId);
    return this.pool_objs[index];
  }

  /** retrieve an array of allocated objids */
  getAllocatedIds(): number[] {
    // obj_map is Map<objId,poolId>
    return [...this.obj_map.keys()];
  }
  /** retrieve an array of allocated objects */
  getAllocated(): I_Poolable[] {
    const ids = this.getAllocatedIds();
    return ids.map(id => this.pool_objs[this.obj_map.get(id)]);
  }
} // end of Pool class

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Pool;
/// forward types as needed
export { I_Poolable, I_PoolOptions };
