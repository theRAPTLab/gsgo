/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  StickyCache

  Works on simple collections: pure objects, maps, and arrays.
  Requires a unique key in objects that is provided at construct time.

  - buffer(collection) ingests objects with id
  - getBufferedValues() returns the contents of the buffer after
    applying an 'age' operation
  - setAgeThreshold(count)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const DBG = require('./common/debug-props');

/// TYPESCRIPT CJS HACK ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {}; // stops VSC from seeing "duplicate functions" across CJS modules

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const log = console.log;
const TEST = false;

/// DIFFER CLASS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** The StickyCache ingests collections of data objects and tracks objects
 *  that disappear, only deleting them after an "age threshold" has been
 *  reached. This helps guard against data underflow when the buffer is read
 *  more often than it is written, as would happen with a DifferenceCache
 */
class StickyCache {
  collection: any; // pure object, map, or array
  cBufferMap: Map<string, any>;
  keyProp: string;
  ageMax: number;

  constructor(key: string) {
    this.collection = []; // holds the collection being ingested
    this.cBufferMap = new Map(); // used to buffer multiple cFrames into one map
    this.keyProp = key || 'id'; // property to use as difference key
    this.ageMax = 5; // maximum "age" for when the buffer is empty
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: Collect input data into a buffer map that for later
   */
  buffer(collection): void {
    if (collection === undefined) {
      console.warn('StickyCache.update arg1 must be collection');
      return;
    }
    const idKey = this.keyProp;
    let arr;
    this.collection = collection;
    if (Array.isArray(collection)) arr = collection;
    else if (collection instanceof Map) arr = [...collection.values()];
    else if (typeof collection === 'object') arr = Object.values(collection);
    // blind write object into buffer
    arr.forEach(obj => {
      const id = obj[idKey];
      obj.age = 0;
      this.cBufferMap.set(id, obj);
    });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: perform difference operation from the cBufferMap through diffArray.
   *  If passed a collection, it's buffered before the diffArray is called
   *  with the contents of the cBufferMap
   */
  getBufferValues() {
    /// age everything out
    this.cBufferMap.forEach(obj => {
      const { id } = obj;
      // let out = `${id} age ${obj.age}: `;
      if (obj.age++ >= this.ageMax) {
        this.cBufferMap.delete(id);
        // out += 'DELETED';
        // console.log(out);
      }
    });
    // return values
    return [...this.cBufferMap.values()];
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: "staleness" is the max value of the object age counter. It is
   *  incremented if an entity has disappeared (step 2 of diffArray), and
   *  reset to 0 if freshly added/updated. Default is no staleness check
   */
  setAgeThreshold(age = 1) {
    this.ageMax = age;
  }
  /** API: Clear the Buffer */
  clearBuffer() {
    this.cBufferMap.clear();
  }
} // end class

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = StickyCache;
