/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  PoolMapper Tests

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Pool, { DiffMaps } from '../vis/lib/class-pool-map';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TEST = true;

/// TESTS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function makeMap(prefix = '', ids) {
  const x = new Map();
  ids.forEach(id => x.set(id, { id, name: `${prefix}-${id}` }));
  return x;
}
function arraysSame(a, b) {
  if (a.length !== b.length) return false;
  a.sort(); // warning: in-place sort!
  b.sort();
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

if (TEST) {
  console.log('running DiffMaps test');
  const s = makeMap('source', [1, 2, 3, 4, 5, 0]);
  const m = makeMap('mapped', [2, 3, 5, 6, 7]);
  const tmp = DiffMaps(s, m, {
    addFunc: () => {},
    updateFunc: () => {},
    removeFunc: () => {},
    removeTest: item => item.id === 6 // only remove id 6
  });
  const { added, updated, removed } = tmp;
  console.assert(arraysSame(updated, [2, 3, 5]), 'fail updated', updated);
  console.assert(arraysSame(added, [0, 1, 4]), 'fail added', added);
  console.assert(arraysSame(removed, [6]), 'fail removed', removed);
}

if (TEST) {
  console.log('running Pool test');
  class MakePoolable {
    constructor() {
      this.init();
    }
    init() {
      this.testReset = false;
      this.valid = false;
    }
    dispose() {}
    validate(flag) {
      this.valid = flag;
    }
  }
  const pool = new Pool('testPool', {
    Constructor: MakePoolable,
    size: 20,
    batchSize: 10
    // autoGrow: default false
  });
  console.assert(pool.size === 20, 'size !== spec 20', pool.size);
  console.assert((pool._pool.length = pool.size), 'size != _pool.length', pool);
  console.assert(pool._avail.length === 20, 'avail expected = 20', pool);
  let o = pool.allocate();
  console.assert(pool.size === 20, 'size !== 20', pool.size);
  console.assert(pool._avail.length === 19, '_avail !== 19');
  pool.deallocate(o);
  console.assert(pool._avail.length === 20, '_avail !== 20');
  const ids = [];
  for (let i = 20; i > 1; i--) {
    o = pool.allocate();
    ids.push(o.poolId);
  }
  console.assert(pool._avail.length === 1, 'after 19 _avail !== 1', pool._avail);
  o = pool.allocate();
  ids.push(o.poolId);
  console.assert(o !== undefined, 'expect 1 more avail instance', pool);
  o = pool.allocate();
  console.assert(o === undefined, 'expect undefined instance', o);
  console.assert(pool._avail.length === 0, 'after 21 _avail !== 0', pool._avail);
  pool.increaseSize();
  console.assert(pool.size === 30, 'expect size ==30', pool.size);
  pool.increaseSize(5);
  console.assert(pool.size === 35, 'expect size ==35', pool.size);
  console.assert(
    pool._avail.length === 15,
    'expect avail==15',
    pool._avail.length
  );
  ids.forEach(poolId => {
    pool.deallocateId(poolId);
  });
  console.assert(
    pool._avail.length === 35,
    'expect avail==35',
    pool._avail.length
  );

  // second pool test
  const autoPool = new Pool('testPool', {
    Constructor: MakePoolable,
    autoGrow: true
  });
  console.assert(autoPool.size === 20, 'autoPool !== 20', autoPool);
  for (let i = 0; i < 25; i++) o = autoPool.allocate();
  console.assert(autoPool.size === 30, 'autoPool 1xGROW !== 30', autoPool);
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default { DiffMaps };
