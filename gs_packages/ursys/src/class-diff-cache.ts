/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  DifferenceCache

  Works on simple collections: pure objects, maps, and arrays.
  Requires a unique key in objects that is provided at construct time.

  Main Operations
  - ingest(collection) sets changeList
  - getChanges() returns changeLists { added, updated, removed }
  - getValues() returns the current elements in the cache

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const DBG = require('./ur-dbg-settings');
const PROMPTS = require('./util/prompts');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const log = console.log;
const PR = PROMPTS.makeStyleFormatter('DiffCache', 'TagDkBlue');

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** print an array of objects keyProp values */
function dump_arr(arr, idKey = 'id') {
  if (!Array.isArray(arr)) {
    log('not an array', typeof arr);
    return '<not an array>';
  }
  if (arr.length === 0) return '[ ]';
  const stop = arr.length - 1;
  const str = arr.reduce((acc, o, idx) => {
    let s = `${acc} ${o[idKey]}`;
    if (idx !== stop) s += ',';
    return s;
  }, '');
  return `[${str} ]`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** simple comparison of two arrays of objects with obj[keyProp] values */
function cmp_arr(ar1, ar2, idKey = 'id') {
  if (!(Array.isArray(ar1) && Array.isArray(ar2))) return false;
  if (ar1.length !== ar2.length) return false;
  const ids2 = ar2.map(obj => obj[idKey]);
  for (let i = 0; i < ar1.length; i++) {
    const id = ar1[i][idKey];
    if (!ids2.includes(id)) return false;
  }
  return true;
}

/// DIFFER CLASS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** The DifferenceCache ingests collections of data objects and keeps track
 *  of what changed since the last ingest.
 */
class DifferenceCache {
  collection: any; // pure object, map, or array
  cMap: Map<string, object>;
  keyProp: string;
  changeLists: { added: any[]; updated: any[]; removed: any[] };

  constructor(key: string) {
    this.collection = []; // holds the collection being ingested
    this.cMap = new Map(); // the mapped version of the collection
    this.keyProp = key || 'id'; // property to use as difference key
    this.changeLists = {
      added: [],
      updated: [],
      removed: []
    };
  }
  /** API: Ingest Data Collection
   *  provide the collection, and return { added, updated, removed } arrays
   */
  ingest(collection) {
    if (collection === undefined) {
      console.warn('DifferenceCache.update arg1 must be collection');
      return undefined;
    }
    this.collection = collection;
    if (Array.isArray(collection)) return this.ingestArray(collection);
    if (collection instanceof Map) return this.ingestMap(collection);
    if (collection.constructor.name === 'Object')
      return this.ingestObjectKeys(collection);
    console.error(
      'DifferenceCache.ingest non-mappable input',
      collection.constructor.name
    );
    return undefined;
  }

  /** API: Retrieve last changes of for ingest, returning an object with
   *  added, updated, removed array properties. The changes are updated
   *  every time ingest() is called.
   */
  getChanges() {
    return this.changeLists;
  }

  getValues() {
    return [...this.cMap.values()];
  }

  /** API: Execute function of form ( value[,index,[array]])=>{},
   *  which is passed to Array.forEach()
   */
  forEach(func) {
    this.getValues().forEach(func);
  }

  /** ingest object with hashkeys mapped to objects with 'keyProp'
   *  used as the unique key: { UADDR_01: { id:123 }, UADDR_02: { id:124 } }
   *  The hashkeys aren't used in the differencing operation.
   */
  ingestObjectKeys(collection) {
    const arr = Object.values(collection);
    return this.ingestArray(arr);
  }

  /** ingest a Map with mapkeys mapped to objects with 'keyProp' used as unique key:
   *  Map UADDR_01 => { id:123 }
   *  The mapkeys aren't used in the differencing operation.
   */
  ingestMap(collection) {
    const arr = [...collection.values()];
    return this.ingestArray(arr);
  }

  /** ingest an array of objects with 'keyProp' used as unique key:
   *  [ { id:123 }, { id:1224 } ]
   */
  ingestArray(collection) {
    const arr = collection;
    const key = this.keyProp;
    const sobjs = this.cMap; // the last mapped collection
    const nobjs = new Map(); // ingested mapped collection
    const updated = [];
    const added = [];
    // (STEP 1) Of incoming collection, objects that are already in the cMap are
    // added to update list, or added list. Each processed object is set in the
    // "new" nobjs to mark it as seen.
    arr.forEach((obj, i) => {
      const id = obj[key];
      const old = sobjs.get(id);
      if (old) {
        // todo: updateHook
        updated.push(obj);
      } else {
        // todo: addHook
        added.push(obj);
      }
      nobjs.set(id, obj);
    });
    // (STEP 2) To calculate what's missing, delete all the objects that were seen in
    // this object from the last collection defined in sobjs; the remainder are
    // the deleted objects
    const n = [...nobjs.values()];
    n.forEach(obj => {
      // todo: removeHook
      const { id } = obj;
      if (sobjs.has(id)) sobjs.delete(id);
    });
    const removed = [...sobjs.values()];
    // (STEP 3) the current collectionMap is the new map.
    // also save the changes arrays
    this.cMap = nobjs;
    this.changeLists = { added, updated, removed };
    return this.changeLists;
  }
}

/// TESTERS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const testDiffer = new DifferenceCache('id');
const tests = {
  'array comparison': {
    a: [{ id: 1 }, { id: 2 }],
    b: [{ id: 2 }, { id: 4 }],
    resAdd: [{ id: 4 }],
    resUpd: [{ id: 2 }],
    resRem: [{ id: 1 }]
  }
};
Object.keys(tests).forEach(testName => {
  console.group('testing', testName);
  const { a, b, resAdd, resUpd, resRem } = tests[testName];
  log('set a:', dump_arr(a));
  log('set b:', dump_arr(b));
  // set initial
  testDiffer.ingest(a);
  // get difference
  testDiffer.ingest(b);
  const { added, updated, removed } = testDiffer.getChanges();
  if (!cmp_arr(added, resAdd)) log('fail: added !== expected result');
  else if (!cmp_arr(updated, resUpd)) log('fail: added !== expected result');
  else if (!cmp_arr(removed, resRem)) log('fail: added !== expected result');
  else log('PASSED: B diff A');
  console.groupEnd();
});

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = DifferenceCache;
