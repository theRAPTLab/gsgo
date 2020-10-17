/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Object Pool (WIP)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { IPoolable, IPoolableConstructor, IPoolOptions } from './t-pool';

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
  pool_objs: Array<IPoolable>; // pool of reusable objects
  avail_objs: Array<number>; // array of available indices
  obj_map: Map<number, number>; // Map obj.id to pool_ids
  //
  _name: string;
  ManagedClass: IPoolableConstructor; // create an object
  _size: number; // current size of pool
  _batch_size: number; // batch size (default to 10)
  _auto_grow: boolean; // whether to grow or die

  constructor(name: string, opt: IPoolOptions) {
    //
    this._name = name;
    //
    this.ManagedClass = opt.Constructor;
    this._size = opt.size || DEFAULT_SIZE;
    this._batch_size = opt.batchSize || DEFAULT_BATCH;
    this._auto_grow = opt.autoGrow || false;
    //
    this.reset();
    this.setSize();
  }

  reset() {
    this.pool_objs = [];
    this.avail_objs = [];
    this.obj_map = new Map();
  }

  /** create a new object from stored ManagedClass constructor */
  makeObject() {
    const o: IPoolable = new this.ManagedClass();
    const pool_id = this.pool_objs.length; // inc by 1
    // make object.id mappable to pool_id
    o._pool_id = pool_id;
    // save new object to pool and make available
    this.pool_objs.push(o);
    this.avail_objs.push(pool_id);
    return o;
  }

  /** set the number of items in the pool */
  setSize(newSize: number = this._size) {
    const pool_size = this.pool_objs.length;
    if (newSize < pool_size) return;
    //
    let add_count = newSize - pool_size;
    if (add_count < this._batch_size) add_count = this._batch_size;
    if (DBG) console.log('adding', add_count, 'objects');
    this.increaseSize(add_count);
  }

  /** add a number of objects to the pool */
  increaseSize(count: number = this._batch_size) {
    while (count-- > 0) this.makeObject();
    this._size = this.pool_objs.length;
    if (DBG) console.log('available', JSON.stringify(this.avail_objs));
  }

  /** retrieve an instance from allocation pool */
  allocateId(objId: number): IPoolable {
    if (objId === undefined) throw Error('allocateId() requires id');
    if (this.obj_map.has(objId)) throw Error(`duplicate id ${objId}`);
    if (DBG) console.log('available', JSON.stringify(this.avail_objs));
    const [index, o] = this._alloc();
    o.id = objId;
    // remove objId to poolId lookup
    this.obj_map.set(o.id, index);
    // tell object to initialize itself
    o.init(objId);
    o.validate(true);
    return o;
  }
  /** non-id version of allocate when you don't want to set the id */
  allocate(): IPoolable {
    const [, o] = this._alloc();
    return o;
  }

  /** private utility method to allocate */
  _alloc(): [number, IPoolable] {
    if (this.avail_objs.length < 1) {
      if (this._auto_grow) {
        this.increaseSize(/* default */);
        const { _name, _size, _batch_size } = this;
        if (DBG)
          console.warn(`'${_name}' pool grew by ${_batch_size} (now ${_size})`);
      } else {
        if (DBG) console.log('available', JSON.stringify(this.avail_objs));
        throw Error(`'${this._name}' maxsize ${this._size} (autoGrow false)`);
      }
    }
    const index: number = this.avail_objs.shift();
    // retrieve something from the pool
    const o = this.pool_objs[index];
    return [index, o];
  }

  /** return an instance to the pool */
  deallocate(o: IPoolable) {
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
  has(objId: number) {
    // obj_map is Map<objId,poolId>
    return this.obj_map.has(objId);
  }

  /** retrieve an allocated object by id (not pool id) */
  get(objId: number): IPoolable {
    const index = this.obj_map.get(objId);
    return this.pool_objs[index];
  }

  /** retrieve an array of allocated objids */
  getAllocatedIds(): number[] {
    // obj_map is Map<objId,poolId>
    return [...this.obj_map.keys()];
  }
  /** retrieve an array of allocated objects */
  getAllocated(): IPoolable[] {
    const ids = this.getAllocatedIds();
    return ids.map(id => this.pool_objs[this.obj_map.get(id)]);
  }

  allocatedCount() {
    return this.getAllocatedIds().length;
  }

  availCount() {
    return this.avail_objs.length;
  }

  name() {
    return this._name;
  }
  size() {
    return this._size;
  }
} // end of Pool class

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Pool;
/// forward types as needed
export { IPoolable, IPoolOptions };
