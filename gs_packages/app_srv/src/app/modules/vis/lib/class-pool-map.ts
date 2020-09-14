/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  PoolMapper

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { I_PoolMappable, I_PoolOptions } from './types-visual';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const DEFAULT_SIZE = 20;
const DEFAULT_BATCH = 10;

/// MODULE HELPERS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Looks for differences between two dictionaries 'source' and 'mapped'
 *  containing objects that have a number id property. Runs a function for
 *  each case.
 *  Returns { added, updated, removed } arrays.
 */
function DiffMaps(source, mapped, opt) {
  // extract custom handler functions
  const { removeTest, addFunc, updateFunc, removeFunc } = opt;
  // provide object mapping utilities
  function f_add(key, source, mapped) {
    const s = source.get(key);
    const m = mapped.get(key);
    addFunc(key, source, mapped);
  }
  function f_remove(key, mapped) {
    const m = mapped.get(key);
    removeFunc(key, source, mapped);
  }
  function f_update(key, source, mapped) {
    const s = source.get(key);
    const m = mapped.get(key);
    updateFunc(key, source, mapped);
  }
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
    key => !skeys.includes(key) && removeTest(mapped.get(key))
  );
  // process all through the appropriate function
  arr_add.forEach(key => f_add(key, source, mapped));
  arr_remove.forEach(key => f_remove(key, mapped));
  arr_update.forEach(key => f_update(key, source, mapped));
  //
  return { added: arr_add, updated: arr_update, removed: arr_remove };
}

function m_add(f: Function) {}

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
  _pool: Array<I_PoolMappable>; // allocated objects
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
    const o: I_PoolMappable = new this.ManagedClass();
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
  deallocate(o: I_PoolMappable) {
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
export { DiffMaps };
