/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  PoolMapper Tests

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Pool from '../vis/lib/class-pool';
import MappedPool from '../vis/lib/class-mapped-pool';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TEST = true;

/// SUPPORTING TEST FUNCTIONS /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class PoolableObject {
  constructor(id) {
    this.init(id);
  }
  init(id) {
    this.id = id;
    this.testReset = false;
    this.valid = false;
  }
  dispose() {
    // id is set to undefined in Pool.deallocate()
  }
  validate(flag) {
    this.valid = flag;
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function makeMap(prefix = '', ids) {
  const x = new Map();
  ids.forEach(id => {
    const obj = new PoolableObject();
    obj.id = id;
    //    obj.name = `${prefix}-${id}`;
    x.set(id, obj);
  });
  return x;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function compareIds(a, b) {
  if (a.length !== b.length) return false;
  a.sort(); // warning: in-place sort!
  b.sort();
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function matchObjects(as, bids) {
  // console.group('matchObjects');
  // console.log(JSON.stringify(as), JSON.stringify(bids));
  if (as.length !== bids.length) return false;
  // in place sort by id order
  as.sort((aobj, bobj) => aobj.id - bobj.id);
  bids.sort();
  for (let i = 0; i < as.length; i++) {
    if (as[i].id !== bids[i]) return false;
  }
  // console.log(JSON.stringify(as), JSON.stringify(bids));
  // console.groupEnd();
  return true;
}

/// TEST DIFFMAP ALGORITHM ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
if (TEST) {
  console.log('running MappedPool test');
  // make a new MappedPool
  const testPool01 = new Pool('TestPool01', {
    Constructor: PoolableObject
  });
  const testSync = new MappedPool(testPool01, {
    onAdd: (sobj, dobj) => {
      dobj.id = sobj.id;
    },
    onUpdate: (sobj, dobj) => {},
    onRemove: dobj => {},
    //    shouldRemove: dobj => dobj.id !== 3 // only remove id 3
    shouldRemove: dobj => true // allow remove all
  });
  // generate maps from arrays with an id in each mapped object
  const frame1 = makeMap('frame1', [0, 1, 2, 3, 4, 5]);
  // del 1 3; add 7; upd 0 2 4 5
  const frame2 = makeMap('frame2', [0, 2, 4, 5, 7]);
  // initial check
  let { added: a1, updated: u1, removed: r1 } = testSync.syncFromMap(frame1);
  if (!matchObjects(u1, [])) console.warn('fail updated', u1);
  if (!matchObjects(a1, [1, 2, 3, 4, 5, 0])) console.warn('fail added', a1);
  if (!matchObjects(r1, [])) console.warn('fail removed', r1);
  // difference check
  let { added: a2, updated: u2, removed: r2 } = testSync.syncFromMap(frame2);
  if (!matchObjects(u2, [0, 2, 4, 5])) console.warn('fail updated', u2);
  if (!matchObjects(a2, [7])) console.warn('fail added', a2);
  // note: testSync shouldRemove() only allows to remove id 3
  if (!matchObjects(r2, [1, 3])) console.warn('fail removed', r2);

  /// TEST POOL /////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  console.log('running Pool test');

  // TEST 1
  const pool = new Pool('testPool1', {
    Constructor: PoolableObject,
    size: 20,
    batchSize: 10
    // autoGrow: default false
  });

  console.assert(pool.size() === 20, 'size !== spec 20', pool.size());
  console.assert(
    (pool.pool_objs.length = pool.size()),
    'size != _pool.length',
    pool
  );
  console.assert(pool.availCount() === 20, 'avail expected = 20', pool);
  let o = pool.allocateId(1);
  console.assert(pool.size() === 20, 'size !== 20', pool.size());
  console.assert(pool.availCount() === 19, '_avail !== 19');
  pool.deallocate(o);
  console.assert(pool.availCount() === 20, '_avail !== 20');
  const ids = [];
  for (let i = 20; i > 1; i--) {
    o = pool.allocateId(i);
    ids.push(o._pool_id);
  }
  console.assert(pool.availCount() === 1, 'after 19 _avail !== 1', pool._avail);
  o = pool.allocate();
  ids.push(o._pool_id);
  console.assert(o !== undefined, 'expect 1 more avail instance', pool);
  let errorThrown = false;
  try {
    o = pool.allocate();
  } catch (e) {
    errorThrown = true;
    console.log('error', errorThrown);
  }
  console.assert(errorThrown, 'expect maxsize error');

  console.assert(pool.availCount() === 0, 'after 21 _avail !== 0', pool._avail);
  pool.increaseSize();
  console.assert(pool.size() === 30, 'expect size ==30', pool.size());
  pool.increaseSize(5);
  console.assert(pool.size() === 35, 'expect size ==35', pool.size());
  console.assert(pool.availCount() === 15, 'expect avail==15', pool.availCount());

  /// TEST 2
  const autoPool = new Pool('testPool2', {
    Constructor: PoolableObject,
    autoGrow: true
  });
  console.assert(autoPool.size() === 20, 'autoPool !== 20', autoPool);
  for (let i = 0; i < 25; i++) autoPool.allocate();
  console.assert(autoPool.size() === 30, 'autoPool 1xGROW !== 30', autoPool);
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {};
