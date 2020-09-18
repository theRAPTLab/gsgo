/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  PoolMapper

  Pool instances manage a set of objects, pre-allocating them for performance
  reasons. It can be set to automatically grow as well, but it does not
  shrink.

  The options.Constructor parameter is a class constructor. This Constructor
  must implement I_Poolable.

  SYNTAX
  // options Constructor
  let pool = new Pool(name, { Constructor });

  // instance operations
  let instance = pool.allocate()
  pool.deallocate(instance)
  //
  instance = pool.allocate();
  let id = instance.id;
  pool.deallocateId(id);

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
  _pool: Array<I_Poolable>; // allocated objects
  _avail: Array<number>; // array of availalbe indexes
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
    this._pool = [];
    this._avail = [];
    this.setSize();
  }

  /** create a new object from stored ManagedClass constructor */
  makeObject() {
    const o: I_Poolable = new this.ManagedClass();
    const pool_id = this._pool.length; // inc by 1
    o.poolId = pool_id;
    this._avail.push(pool_id); // add new instance indexes
    this._pool.push(o); // save new object
    return o;
  }

  /** set the number of items in the pool */
  setSize(newSize: number = this.size) {
    const pool_size = this._pool.length;
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
    this.size = this._pool.length;
    if (DBG) console.log('available', JSON.stringify(this._avail));
  }

  /** retrieve an instance from allocation pool */
  allocate() {
    if (this._avail.length < 1) {
      if (this.autoGrow) {
        this.increaseSize(/* default */);
      } else {
        if (DBG) console.log('available', JSON.stringify(this._avail));
        return undefined;
      }
    }
    if (DBG) console.log('available', JSON.stringify(this._avail));
    const index: number = this._avail.shift();
    const o = this._pool[index];
    o.init();
    o.validate(true);
    return o;
  }

  /** return an instance to the pool */
  deallocate(o: I_Poolable) {
    const id = o.poolId;
    this._avail.push(id);
    o.dispose(); // deallocate instance-specific stuff
    o.validate(false); //
    if (DBG) console.log('available', JSON.stringify(this._avail));
  }

  /** deallocate an instance by id */
  deallocateId(poolId: number) {
    const o = this._pool[poolId];
    if (o.poolId !== poolId) throw Error(`bad dealloc: ${poolId}!==${o.poolId}`);
    this.deallocate(o);
  }
} // end of Pool class

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Pool;
/// forward types as needed
export { I_Poolable, I_PoolOptions };
