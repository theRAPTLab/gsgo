/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  DifferenceCache

  Works on simple collections: pure objects, maps, and arrays.
  Requires a unique key in objects that is provided at construct time.

  Main Operations
  - ingest(collection)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const DBG = require('./ur-dbg-settings');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const log = console.log;

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
export class DifferenceCache {
  constructor(key) {
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
    if (collection instanceof Set) return this.ingestSet(collection);
    if (collection.constructor.name === 'object') return this.ingestFromObject();
    console.warn('DifferenceCache.update non-mappable input', collection);
    return undefined;
  }

  /** API: Retrieve last changes of for ingest, returning an object with
   *  added, updated, removed array properties. The changes are updated
   *  every time ingest() is called.
   */
  getChanges() {
    return this.changeLists;
  }

  getCollection() {
    return [...this.cMap.values()];
  }

  ingestArray() {
    const arr = this.collection;
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
    [...nobjs.values()].forEach(obj => {
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

  ingestMap() {
    throw Error('not implemented');
  }

  ingestSet() {
    throw Error('not implemented');
  }

  ingestFromObject() {
    throw Error('not implemented');
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
  log('compare added', dump_arr(added), cmp_arr(added, resAdd));
  log('compare updat', dump_arr(updated), cmp_arr(updated, resUpd));
  log('compare remov', dump_arr(removed), cmp_arr(removed, resRem));
  console.groupEnd();
});

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// above functions, classes are exported
