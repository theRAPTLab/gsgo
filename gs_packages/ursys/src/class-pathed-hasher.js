/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  PathedHasher

  A key-value store like a Map, but the key can be 'a.b.c' and the class
  will automatically create Maps within Maps for your value.


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const log = console.log;

/// UTILITY FUNCTIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** base algorithm for checking that the path is ALL nested maps */
function _hasPathedMap(path, map) {
  if (typeof path !== 'string' || !(map instanceof Map))
    console.error('arg1 must be string, arg2 must be Map');
  const bits = path.split('.');
  let m = map;
  const result = bits.reduce((acc, bit) => {
    if (!(m instanceof Map)) return false;
    let n = m.get(bit);
    const isMap = n instanceof Map;
    m = n;
    return acc && isMap;
  }, true);
  return result;
}

/** base algorithm for ensuring a path will be fully mapped.
 *  returns the last map in the chain.
 */
function _ensurePathedMap(path, map) {
  if (typeof path !== 'string' || !(map instanceof Map))
    console.error('arg1 must be string, arg2 must be Map');
  const bits = path.split('.');
  let m = map;
  bits.forEach(bit => {
    let n = m.get(bit);
    if (typeof n === 'undefined') {
      n = new Map();
      m.set(bit, n);
    }
    if (!(n instanceof Map)) throw Error('non-Map found in map path!');
    m = n;
  });
  return m;
}
/** base algorithm for retrieving a value */
function _getPathedMap(path, map) {
  if (typeof path !== 'string' || !(map instanceof Map))
    console.error('arg1 must be string, arg2 must be Map');
  const bits = path.split('.');
  let m = map;
  bits.forEach(bit => {
    if (!(m instanceof Map)) {
      m = undefined;
      return;
    }
    let n = m.get(bit);
    m = n;
  });
  return m;
}

/// PATHED MAP CLASS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Interprets a string key as a dotted path with a terminal key, creating
 *  nested maps as needed. Useful when hashing off more than one string key,
 *  maybe!
 */
class PathedMap {
  constructor() {
    this.map = new Map();
  }
  /** Returns the value in the last map in the path, where the final
   *  part of the path is the key */
  get(path) {
    const bits = path.split('.');
    const key = bits.pop();
    return _getPathedMap(bits, this.map).get(key);
  }
  /** Returns the value in the last map in the path, where the final
   *  part of the path is the key. It will create the intermediate
   *  maps in the path if they don't exist. */
  set(path, value) {
    const bits = path.split('.');
    const key = bits.pop();
    const lastMap = _ensurePathedMap(bits, this.map);
    lastMap.set(key, value);
  }
  /** Returns true if there is value for the key */
  has(path, value) {
    const bits = path.split('.');
    const key = bits.pop();
    const lastMap = _getPathedMap(bits, this.map);
    return lastMap.has(key);
  }
}

/// TESTERS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let base = new Map();
// make test data
let m = base; // base map
let n = new Map();
m.set('one', n);
m = n;
n = new Map();
m.set('two', n);
m = n;
n = new Map();
m.set('three', n);
// define tests

function _test123(srcmap) {
  const tests = {
    'hasPath one.two.three': {
      testMap: srcmap,
      testPath: 'one.two.three',
      expect: true
    },
    'hasPath one.blah.three': {
      testMap: srcmap,
      testPath: 'one.blah.three',
      expect: false
    },
    'hasPath one.two.three.four': {
      testMap: srcmap,
      testPath: 'one.two.three.four',
      expect: false
    }
  };
  Object.keys(tests).forEach(testName => {
    const { testMap, testPath, expect } = tests[testName];
    log(
      testName,
      'testPath',
      testPath,
      'expect:',
      expect,
      'pass:',
      expect === _hasPathedMap(testPath, testMap)
    );
  });
}
console.groupCollapsed('testing _hasPathedMap');
_test123(base);
console.groupEnd();

console.groupCollapsed('testing _ensurePathedMap with _hasPathedMap');
base = new Map();
_ensurePathedMap('one.two.three', base);
_test123(base);
console.groupEnd();

console.groupCollapsed('testing _getPathedMap with _ensurePathedMap');
_ensurePathedMap('one.alpha', base); // add a map
const amap = _getPathedMap('one.alpha', base);
log('get map one.alpha expect:true pass:', amap instanceof Map === true);
log(
  'add one.alpha map expect:true pass:',
  _hasPathedMap('one.alpha', base) === true
);
log(
  'add one.alpha.zed map expect:false pass:',
  _hasPathedMap('one.alpha.zed', base) === false
);
log(
  'add one.two.three map expect:true pass:',
  _hasPathedMap('one.two.three', base) === true
);
console.groupEnd();

console.group('testing PathedHasher class');
const pHasher = new PathedMap();
console.groupEnd();

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = PathedMap;
