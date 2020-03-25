/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  A class for managing hash-mapped data and detecting differences
  in a dataset.

  (1) manages differences - an array of just keys of your object is
      passed in, and DataMap returns what's the same or different.
  (2) stores related data by key into a Map()
  (3) utility methods for managing collections and their objects from
      the LokiJS database

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// list of collection names stored in database
const DBKEYS = [
  `teachers`,
  `classrooms`,
  `groups`,
  `models`,
  `criteria`,
  `sentenceStarters`,
  `ratingsDefinitions`,
  `classroomResources`,
  `resources`,
  `pmcData`,
  `pmcData.entities`,
  `pmcData.comments`,
  `pmcData.markedread`,
  `pmcData.visuals`
];

/// list of valid database change commands
const DBCMDS = new Map([
  ['add', 'NET:SRV_DBADD'],
  ['update', 'NET:SRV_DBUPDATE'],
  ['remove', 'NET:SRV_DBREMOVE']
]);

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/**
 *  An object containing the differences detected between an array NOW vs
 *  an array the LAST TIME
 *  @typedef {Object} ArrayChangeObject
 *  @property {Array} added -
 *  @property {Array} removed -
 *  @property {Array} updated -
 */
/// CLASS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class DataMap {
  constructor() {
    this.ids = []; // array of string ids
    this.idsUpdated = [];
    this.idsAdded = [];
    this.idsRemoved = [];
    this.map = new Map();
    this.selection = new Set();
  }

  /** Given an array of elements, return the differences since the last
   *  call. Useful for managing data protocols that send the entire list
   *  of entities in an array.
   *  @param {Array<string>} arr - array of elements. The elements should be usable
   *  as keys in a Map.
   *  @returns {ArrayChangeObject} - { added, updated, removed }
   */
  GetChanges(arr) {
    const results = DataMap.f_deltaFilterIDArray(arr, this.map);
    // save results
    this.idsAdded = results.added;
    this.idsRemoved = results.removed;
    this.idsUpdated = results.updated;
    // return results
    return { added, removed, updated };
  }

  /**
   *  @param {*} id - array value to compare
   *  @returns {boolean} - true if id exists in the map
   */
  Has(id) {
    return this.map.has(id);
  }

  /** Retrieve
   *  @param {string} id - key
   *  @returns {string} - the object associated with the key
   */
  Get(id) {
    return this.map.get(id);
  }

  /**
   *  @param {string} id - key
   *  @param {string} element - element
   */
  Set(id, element) {
    this.map.set(id, element);
  }
}

/// STATIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DataMap.DBKEYS = DBKEYS;
DataMap.DBCMDS = DBCMDS;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** returns an array of valid TOP LEVEL collections
 */
DataMap.Collections = () => {
  return DBKEYS.filter(el => !el.includes('.'));
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** validate that keyName is a valid DBKEY
 *  @param {string} keyName - extract from the DBSYNC data props
 */
DataMap.IsValidKey = keyName => {
  return DBKEYS.includes(keyName);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** validate command is valid
 *  @param {string} command - extract from the DBSYNC data.cmd prop
 */
DataMap.ValidateCommand = command => DBCMDS.has(command);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** lookup server message
 *  @param {string} command - a valid key
 */
DataMap.GetCommandMessage = command => DBCMDS.get(command);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Used by server to parse DBQuery data object for modify, add, or update ops.
 *  For parsing the response, see ExtractSyncData
 *  There are two input data formats:
 *  key    { 'pmcData': value }
 *         .. where val is an object with an id
 *  subkey { 'pmcData.entities': { id, entities: value }
 *         .. where id is a modelId and val is a single entity obj
 *  @param {Object} data - object with properties matching DBKEY contain array of values
 *  @returns {Array} - an array of { colkey, subkey, value } for each matching DBKEY
 */
DataMap.ExtractQueryData = data => {
  let queries = [];
  // the colkey might be a compound key (e.g. pmcData.entities)
  Object.keys(data).forEach(foundKey => {
    // only return keys that match a collection name
    if (!DataMap.IsValidKey(foundKey)) return;
    // process valid key
    let value = data[foundKey]; // should be an object always
    if (Array.isArray(value)) {
      console.warn(`key: ${foundKey} is an array; did you mean to use ExtractSyncData() instead?`);
      return;
    }
    if (typeof value !== 'object') {
      console.warn(`key: ${foundKey} value is not an object`);
      return;
    }
    // prepare for write
    const [colkey, subkey] = foundKey.split('.');
    const entry = { colkey, subkey, value };
    queries.push(entry);
  });
  return queries;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return an array of keys and update objects. Used to parse the update or
 *  response from a DBQuery. Input formats are:
 *  .. key            { 'pmcData': [ {...} ] }
 *  .. key w/subkey   { 'pmcData.entities': [ {...} ] }
 *  Return values are:
 * .. colkey : string (e.g. 'pmcData' )
 * .. subkey : string (e.g. 'entities' )
 * .. value  : object (e.g. { id:2, type:'prop', name:'Fish' } )
 */
DataMap.ExtractSyncData = data => {
  const syncitems = [];
  Object.keys(data).forEach(foundKey => {
    // only return keys that match a collection name
    if (!DataMap.IsValidKey(foundKey)) return;
    // process valid key
    let values = data[foundKey]; // should be an object always
    const [colkey, subkey] = foundKey.split('.');
    values.forEach(value => {
      const entry = { colkey, subkey, value };
      syncitems.push(entry);
    });
  });
  return syncitems;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** validate that data has valid keys DB keys. Returns number of found keys
 *  that conform to type
 *  key    { 'pmcData': value }
 *         .. where val is an object with an id
 *  subkey { 'pmcData.entities': { id, entities: value }
 *         .. where id is a modelId and val is a single entity obj
 * @param {string} cobj - collection object with collection keys
 */
DataMap.ValidateCollections = cobj => {
  const { cmd } = cobj;
  let count = 0;
  Object.keys(cobj).forEach(colkey => {
    // only return colkey that match a collection name
    if (!DataMap.IsValidKey(colkey)) return;
    // extract the collection
    const value = cobj[colkey];
    // if we got this far, then the colkey contained a non-array
    let ok = true;
    switch (cmd) {
      case 'add':
        ok &= f_validateAdd(value, colkey);
        break;
      case 'update':
        ok &= f_validateUpdate(value, colkey);
        break;
      case 'remove':
        ok &= f_validateRemove(value, colkey);
        break;
      default:
        console.log(cmd);
        throw Error(`${colkey} unknown command ${cmd}`);
    } // switch
    if (!ok) throw Error(`${key}.${cmd} single value mystery error`);
    // sucessful processing
    count++;
  }); // foreach colkey...loop to next one

  // finished processing everything, return the count of processed collection
  // if we dont' get this far, an error had been thrown
  return count;
};

function f_validateAdd(value, key) {
  if (!key) throw Error(`arg2 key required`);
  const [colkey, subkey] = key.split('.');
  const vtype = typeof value;
  if (vtype !== 'object') throw Error(`${key}.add: requires OBJECTS with no id`);
  if (subkey) {
    if (!value.id) throw Error(`${key}.add requires a top-level id to select subkey field`);
    if (value[subkey].id) throw Error(`${key}.add: ${subkey} value can not have an id`);
  } else {
    if (value.id) throw Error(`${key}.add: ${colkey} value can not have an id`);
  }
  return true;
}
function f_validateUpdate(value, key) {
  if (!key) throw Error(`arg2 key required`);
  const [colkey, subkey] = key.split('.');
  const vtype = typeof value;
  if (vtype !== 'object') throw Error(`${key}.update: requires OBJECTS with an id, not ${vtype}`);
  if (!DataMap.IsValidId(value.id)) throw Error(`${colkey}.update has invalid id ${value.id}`);
  if (subkey) {
    if (typeof value[subkey] !== 'object') throw Error(`${key}.update expected sub object`);
    const subid = value[subkey].id;
    if (!DataMap.IsValidId(subid))
      throw Error(`${key}.update invalid id ${subid} typeof ${typeof subid}`);
  }
  return true;
}
function f_validateRemove(value, key) {
  if (!key) throw Error(`arg2 key required`);
  const [colkey, subkey] = key.split('.');
  const vtype = typeof value;
  if (vtype !== 'object') throw Error(`${key}.remove expected object value`);
  if (!DataMap.IsValidId(value.id)) throw Error(`${key}.remove has invalid id ${value.id}`);
  if (subkey) {
    if (typeof value[subkey] !== 'object') throw Error(`${key}.remove expects sub object with id`);
    if (!DataMap.IsValidId(value[subkey].id))
      throw Error(`${key}.remove subobject must have valid id`);
  }
  return true;
}
// called by DataMap.GetChange() instance method
// modifies elementMap
// returns added, removed, updated arrays id list
function f_deltaFilterIDArray(arr, elementMap = new Map()) {
  // find what matches and what is new
  const added = [];
  const updated = [];
  const removed = [];

  arr.forEach(id => {
    if (elementMap.has(id)) updated.push();
    else added.push(id);
  });
  elementMap.forEach((val, id) => {
    if (!updated.includes(id)) removed.push(id);
  });
  // return results
  return { added, removed, updated };
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given an input, insure that it is an int >=0
 */
DataMap.IsValidId = id => {
  let test = Number.parseInt(id) === id;
  return test && id >= 0;
};
/** given an array of idsObjs, report that all that it is an int >=0
 */
DataMap.HasValidIdObjs = ids => {
  if (!Array.isArray(ids)) throw Error(`arg1 must be array of objects`);
  return ids.every(idObj => DataMap.IsValidId(idObj.id));
};
/** given an array of ids, report if all vonfirm
 */
DataMap.IsValidIdsArray = ids => {
  if (!Array.isArray(ids)) throw Error(`arg1 must be array of ints`);
  return ids.every(id => DataMap.IsValidId(id));
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given an original object, modify a key inside it with the supplied data
 *  It's assumed the the propname is for an array of objs w/ id { id, ... }
 * @param {object} obj - object with property list to search/modify
 * @param {string} propname - name of property to extract list from obj
 * @param {object} updObj - new data to replace existing object by id match
 */
DataMap.MutateObjectProp = (obj, propname, updObj) => {
  if (typeof obj !== 'object') throw Error('arg1 must be object');
  if (typeof propname !== 'string') throw Error('arg2 must be string');
  if (typeof updObj !== 'object') throw Error('arg3 must be object');
  if (!DataMap.IsValidId(updObj.id)) throw Error('arg3 must be object with id');
  const id = updObj.id;
  const list = obj[propname];
  const found = list.find(el => el.id === id);
  //
  if (!found) return undefined;
  //
  // if we got this far, mutate
  const sBefore = JSON.stringify(obj);
  const sIdObj = JSON.stringify(updObj);
  Object.assign(found, updObj);
  const sAfter = JSON.stringify(obj);
  // return a copy without loki metadata for return
  const retobj = Object.assign({}, found);
  retobj.$loki = undefined;
  retobj.meta = undefined;
  if (DBG) console.log(`UpdateObjectProp:\n.. old:${sBefore}\n.. new:${sAFter}`);
  return retobj;
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Overwrite the original object with changes in second object
 */
DataMap.MutateObject = (obj, idObj) => {
  if (typeof obj !== 'object') throw Error('arg1 must be object');
  if (typeof idObj !== 'object') throw Error('arg2 must be object');
  if (!DataMap.IsValidId(idObj.id)) throw Error('arg2 must be object with id');
  Object.assign(obj, idObj);
  // return a copy without loki metadata for return
  const retobj = Object.assign({}, obj);
  retobj.$loki = undefined;
  retobj.meta = undefined;
  return retobj;
};

/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = DataMap;
